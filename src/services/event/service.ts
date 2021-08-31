import axios, { AxiosInstance } from "axios";

import { DataDog, Alert, Config, Reboot } from "..";
import { AlertColor } from "../datadog/types";
import {
  DataDogMonitorStatus,
  DiscordChannel,
  BlockChainMonitorEvents,
  EventTransitions,
  EventTypes,
  LoadBalancerHosts,
  LoadBalancerStatus,
  Hosts,
  SupportedBlockChains,
} from "./types";
import { exclude } from "./exclude";
/**
 * This class functions as an event consumer for DataDog alerts.
 * Events are dependant on parsing format in parseWebhookMessage in the DataDog Service
 */

export class Service {
  private agent: AxiosInstance;
  private alert: Alert;
  private config: Config;
  private dd: DataDog;
  constructor() {
    this.agent = this.initAgentClient();
    this.alert = new Alert();
    this.config = new Config();
    this.dd = new DataDog();
  }

  private initAgentClient() {
    return axios.create({
      headers: { "Content-Type": "application/json" },
    });
  }
  private async isPeerOk({ chain, host }) {
    const hosts = Object.keys(LoadBalancerHosts);
    const peer = hosts.filter((h) => !(h == host.toUpperCase(host))).join("");
    console.log({chain, host, peer})
    const { Value: monitorId } = await this.config.getMonitorId({ chain, host: peer });

    console.log(await this.dd.getMonitorStatus(monitorId))
    return (await this.dd.getMonitorStatus(monitorId)) !== DataDogMonitorStatus.ALERT;
  }
  async disableServer({ hostname, backend, host }) {
    try {
      await this.agent.post(`http://${hostname}:3001/webhook/lb/disable`, { backend, host });
    } catch (error) {
      throw new Error(`could not contact agent to disable ${error}`);
    }
  }
  async enableServer({ hostname, backend, host }) {
    try {
      await this.agent.post(`http://${hostname}:3001/webhook/lb/enable`, { backend, host });
    } catch (error) {
      throw new Error(`could not contact agent to enable ${error}`);
    }
  }

  getDockerEndpoint({ chain, host }): string {
    for (const prop in Hosts) {
      const [node] = prop.split("_");
      if (chain.toUpperCase() === node) {
        return Hosts[`${node}_${host.toUpperCase()}`];
      }
      return Hosts[`SHARED_${host.toUpperCase()}`];
    }

    return;
  }
  async processEvent(raw) {
    const {
      event,
      chain,
      host,
      container,
      id,
      transition,
      type,
      title,
      backend,
      link,
    } = await this.dd.parseWebhookMessage(raw);

    console.log({
      event,
      chain,
      host,
      container,
      id,
      transition,
      type,
      title,
      backend,
      link,
    });

    const status = await this.config.getNodeStatus({ chain, host });

    if (!status) {
      await this.config.setNodeStatus({ chain, host, status: LoadBalancerStatus.ONLINE });
    }

    if (transition === EventTransitions.TRIGGERED) {
      if (type === EventTypes.ERROR) {
        if (event === BlockChainMonitorEvents.OFFLINE) {
          await this.alert.sendDiscordMessage({
            title,
            color: AlertColor.ERROR,
            channel: DiscordChannel.WEBHOOK_CRITICAL,
            fields: [
              {
                name: "Node Offline",
                value: `${chain}/${host} status is ${event} \n 
                If this is not offline due to planned maintenance, the host is down! \n
                If this was expected please mute the monitor in the DataDog monitor console next time.
                See event ${link}`,
              },
            ],
          });
        }
        if (event === BlockChainMonitorEvents.NO_RESPONSE) {
          await this.alert.sendDiscordMessage({
            title,
            color: AlertColor.WARNING,
            channel: DiscordChannel.WEBHOOK_NON_CRITICAL,
            fields: [
              {
                name: "Warning",
                value: `${chain}/${host} status is ${event} \n 
              The load balancer will automatically prevent traffic from being sent to this node. \n
              If it does not recover in 10 minutes it will be rebooted. \n
              Reboots only apply to Docker containers. \n
              Please manually reboot non-Docker nodes host if there is a second alert for ${chain}/${host} \n
              See event ${link}`,
              },
            ],
          });
        }

        if (event === BlockChainMonitorEvents.NOT_SYNCHRONIZED) {
          if (status === LoadBalancerStatus.ONLINE) {
            await this.alert.sendDiscordMessage({
              title,
              color: AlertColor.ERROR,
              channel: DiscordChannel.WEBHOOK_CRITICAL,
              fields: [
                {
                  name: "Error",
                  value: `${chain}/${host} is ${event} \n See event ${link}`,
                },
              ],
            });

            if (!await this.isPeerOk({ chain, host })) {
              await this.alert.sendDiscordMessage({
                title,
                color: AlertColor.ERROR,
                channel: DiscordChannel.WEBHOOK_CRITICAL,
                fields: [
                  {
                    name: "CRITICAL ERROR!",
                    value: `Both ${chain} nodes are unhealthy`,
                  },
                ],
              });
              return;
            }

            await this.alert.sendDiscordMessage({
              title,
              color: AlertColor.INFO,
              channel: DiscordChannel.WEBHOOK_NON_CRITICAL,
              fields: [
                {
                  name: "Fixing",
                  value: `Removing ${chain}/${host} from load balancer`,
                },
              ],
            });

            const hostname = LoadBalancerHosts[host.toUpperCase()];

            try {
              await this.disableServer({ hostname, backend, host });
              await this.config.setNodeStatus({ chain, host, status: LoadBalancerStatus.OFFLINE });
              await this.alert.sendDiscordMessage({
                title,
                color: AlertColor.INFO,
                channel: DiscordChannel.WEBHOOK_NON_CRITICAL,
                fields: [
                  {
                    name: "Fixing",
                    value: `Removed ${chain}/${host} from load balancer, it will be restored once healthy again`,
                  },
                ],
              });
            } catch (error) {
              await this.alert.sendDiscordMessage({
                title,
                color: AlertColor.ERROR,
                channel: DiscordChannel.WEBHOOK_CRITICAL,
                fields: [
                  {
                    name: "error",
                    value: `could not remove server ${error}`,
                  },
                ],
              });
            }
            return;
          }

          if (status === LoadBalancerStatus.OFFLINE) {
            await this.alert.sendDiscordMessage({
              title,
              color: AlertColor.ERROR,
              channel: DiscordChannel.WEBHOOK_NON_CRITICAL,
              fields: [
                {
                  name: "error",
                  value: "Node is still out of synch",
                },
              ],
            });
          }
        }
      }
    }

    if (transition === EventTransitions.RECOVERED) {
      if (event === BlockChainMonitorEvents.HEALTHY) {
        if (status === LoadBalancerStatus.ONLINE) {
          //this case is for when NO_RESPONSE recovers
          await this.alert.sendDiscordMessage({
            title,
            color: AlertColor.SUCCESS,
            channel: DiscordChannel.WEBHOOK_NON_CRITICAL,
            fields: [
              {
                name: "Success",
                value: `${chain}/${host} have recovered!`,
              },
            ],
          });
        }

        if (status === LoadBalancerStatus.OFFLINE) {
          //this case is to put the node back into rotation
          await this.config.setNodeStatus({ chain, host, status: LoadBalancerStatus.ONLINE });
          await this.alert.sendDiscordMessage({
            title,
            color: AlertColor.INFO,
            channel: DiscordChannel.WEBHOOK_NON_CRITICAL,
            fields: [
              {
                name: "Node is in Synch",
                value: `${chain}/${host} will be added back to the load balancer`,
              },
            ],
          });

          const hostname = LoadBalancerHosts[host.toUpperCase()];

          try {
            await this.enableServer({ hostname, backend, host });

            await this.alert.sendDiscordMessage({
              title,
              color: AlertColor.INFO,
              channel: DiscordChannel.WEBHOOK_NON_CRITICAL,
              fields: [
                {
                  name: "Fixed!",
                  value: `Added ${chain}/${host} back to load balancer`,
                },
              ],
            });
          } catch (error) {
            await this.alert.sendDiscordMessage({
              title,
              color: AlertColor.ERROR,
              channel: DiscordChannel.WEBHOOK_NON_CRITICAL,
              fields: [
                {
                  name: "error",
                  value: `could not remove server ${error}`,
                },
              ],
            });
          }

          await this.alert.sendDiscordMessage({
            title,
            color: AlertColor.SUCCESS,
            channel: DiscordChannel.WEBHOOK_NON_CRITICAL,
            fields: [
              {
                name: "Success",
                value: "Node restored to operation",
              },
            ],
          });
        }
      }
    }

    if (transition === EventTransitions.RE_TRIGGERED) {
      if (
        event === BlockChainMonitorEvents.NO_RESPONSE_NOT_RESOLVED ||
        event === BlockChainMonitorEvents.OFFLINE
      ) {
        if (exclude.includes(chain)) {
          return await this.alert.sendDiscordMessage({
            title,
            color: AlertColor.INFO,
            channel: DiscordChannel.WEBHOOK_CRITICAL,
            fields: [
              {
                name: "Alert",
                value: `${chain}/${host} is still down and must be recovered`,
              },
            ],
          });
        }

        const url = this.getDockerEndpoint({ chain, host });
        const reboot = await this.agent.post(`http://${url}:3001/webhook/docker/reboot`, {
          name: container,
        });
        await this.dd.muteMonitor({ id, minutes: 5 });

        return await this.alert.sendDiscordMessage({
          title,
          color: AlertColor.INFO,
          channel: DiscordChannel.WEBHOOK_NON_CRITICAL,
          fields: [
            {
              name: "Rebooting",
              value: `${reboot}`,
            },
          ],
        });
      }

      if (event === BlockChainMonitorEvents.NOT_SYNCHRONIZED_NOT_RESOLVED) {
        //check lb status

        return await this.alert.sendDiscordMessage({
          title,
          color: AlertColor.ERROR,
          channel: DiscordChannel.WEBHOOK_NON_CRITICAL,
          fields: [
            {
              name: "Alert",
              value: `${chain}/${host} is still not synchronized and will remain out of rotation`,
            },
          ],
        });
      }
    }
  }
}
