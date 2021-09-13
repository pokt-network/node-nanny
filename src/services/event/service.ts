import axios, { AxiosInstance } from "axios";
import { DataDog, Alert, Config } from "..";
import { AlertColor } from "../datadog/types";
import {
  DataDogMonitorStatus,
  DiscordChannel,
  BlockChainMonitorEvents,
  EventTransitions,
  EventTypes,
  LoadBalancerHostsInternal,
  LoadBalancerHostsExternal,
  LoadBalancerStatus,
  Hosts,
  SupportedBlockChains,
  InstanceIds
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
    //find a better way to determine peer
    const hosts = Object.keys(LoadBalancerHostsInternal);
    const peer = hosts.filter((h) => !(h == host.toUpperCase(host))).join("");
    const { Value: monitorId } = await this.config.getMonitorId({ chain, host: peer });

    return (await this.dd.getMonitorStatus(monitorId)) !== DataDogMonitorStatus.ALERT;
  }
  async disableServer({ backend, host }) {
    try {
      return await Promise.all([
        this.agent.post(`http://${LoadBalancerHostsInternal["2A"]}:3001/webhook/lb/disable`, { backend, host }),
        this.agent.post(`http://${LoadBalancerHostsInternal["2B"]}:3001/webhook/lb/disable`, { backend, host })
      ])
    } catch (error) {
      throw new Error(`could not contact agent to disable ${error}`);
    }
  }
  async enableServer({ backend, host }) {
    try {
      return await Promise.all([
        this.agent.post(`http://${LoadBalancerHostsInternal["2A"]}:3001/webhook/lb/enable`, { backend, host }),
        this.agent.post(`http://${LoadBalancerHostsInternal["2B"]}:3001/webhook/lb/enable`, { backend, host })
      ])
    } catch (error) {
      throw new Error(`could not contact agent to enable ${error}`);
    }
  }
  async getBackendStatus(backend) {
    return await Promise.all([
      this.agent.post(`http://${LoadBalancerHostsInternal["2A"]}:3001/webhook/lb/enable`, { backend }),
      this.agent.post(`http://${LoadBalancerHostsInternal["2B"]}:3001/webhook/lb/enable`, { backend })
    ])
  }
  getDockerEndpoint({ chain, host }): string {
    for (const prop in Hosts) {
      const [node] = prop.split("_");
      if (chain.toUpperCase() === node) {
        return Hosts[`${node}_${host.toUpperCase()}`];
      }
    }
    return Hosts[`SHARED_${host.toUpperCase()}`];
  }

  getHostId({ chain, host }): string {
    for (const prop in InstanceIds) {
      const [node] = prop.split("_");
      if (chain === node) {
        return InstanceIds[`${node}_${host}`];
      }

    }
    return InstanceIds[`shared_${host}`];
  }

  async getBlockHeightDifference({ chain, host }) {
    const hosts = Object.keys(LoadBalancerHostsInternal);
    const peer = hosts.filter((h) => !(h == host.toUpperCase(host))).join("").toLowerCase();
    let logs = await this.dd.getHealthLogs({ chain, host })
    const peerLogs = await this.dd.getHealthLogs({ chain, host: peer })
    logs = logs.concat(peerLogs)
    logs = logs.sort((a, b) => a.delta - b.delta)
    return { best: logs[0], worst: logs[logs.length - 1] }
  }


  getHAProxyMessage(backend) {
    return `HAProxy status\n
    2A: http://${LoadBalancerHostsExternal.SHARED_2A}:8050/;up?scope=${backend} \n
    2B: http://${LoadBalancerHostsExternal.SHARED_2B}:8050/;up?scope=${backend} 
    `
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


    const status = await this.config.getNodeStatus({ chain, host });

    if (!status) {
      await this.config.setNodeStatus({ chain, host, status: LoadBalancerStatus.ONLINE });
    }

    if (transition === EventTransitions.TRIGGERED) {

      const instance = await this.getHostId({ chain, host })
      const logs = await this.dd.getContainerLogs({ instance, container })

      const fields = logs.map(({ service, timestamp, message }) => {
        return {
          name: `${timestamp}-${service}`,
          value: `${`${message}`}`
        }
      })

      await this.alert.sendDiscordMessage({
        title,
        color: AlertColor.INFO,
        channel: DiscordChannel.WEBHOOK_LOGS,
        fields
      });


      //Not Syncronized and the node is in operation
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
            //Both nodes are out of sync
            let { worst, best } = await this.getBlockHeightDifference({ chain, host })
            await this.disableServer({ backend, host: worst.host });
            await this.config.setNodeStatus({ chain, host, status: LoadBalancerStatus.OFFLINE });
            await this.alert.sendDiscordMessage({
              title,
              color: AlertColor.INFO,
              channel: DiscordChannel.WEBHOOK_NON_CRITICAL,
              fields: [
                {
                  name: "Looking for best node",
                  value: `Removed ${chain}/${worst.host} from load balancer, it will be restored once healthy again \n
                  The best node is ${best.delta} blocks out of sync \n
                  ${this.getHAProxyMessage(backend)}
                  `,
                },
              ],
            });

            return;
          }

          try {
            await this.disableServer({ backend, host });
            await this.config.setNodeStatus({ chain, host, status: LoadBalancerStatus.OFFLINE });
            await this.alert.sendDiscordMessage({
              title,
              color: AlertColor.INFO,
              channel: DiscordChannel.WEBHOOK_NON_CRITICAL,
              fields: [
                {
                  name: "Removing node from rotation",
                  value: `Removed ${chain}/${host} from load balancer, it will be restored once healthy again \n
                    ${this.getHAProxyMessage(backend)}
                  `,
                },
              ],
            });
          } catch (error) {
            await this.alert.sendDiscordMessage({
              title,
              color: AlertColor.ERROR,
              channel: DiscordChannel.WEBHOOK_ERRORS,
              fields: [
                {
                  name: "error",
                  value: `could not remove server ${error}`,
                },
              ],
            });
          }
        }

        //node is offline
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
              See event ${link}`,
            },
          ],
        });
      }
      if (status === LoadBalancerStatus.OFFLINE) {
        await this.alert.sendDiscordMessage({
          title,
          color: AlertColor.WARNING,
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


    if (transition === EventTransitions.RECOVERED) {
      if (event === BlockChainMonitorEvents.NOT_SYNCHRONIZED) {
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

          try {
            await this.enableServer({ backend, host });
            await this.alert.sendDiscordMessage({
              title,
              color: AlertColor.SUCCESS,
              channel: DiscordChannel.WEBHOOK_NON_CRITICAL,
              fields: [
                {
                  name: "Restored",
                  value: `Added ${chain}/${host} back to load balancer \n
                  ${this.getHAProxyMessage(backend)}
                `,
                },
              ],
            });
          } catch (error) {
            await this.alert.sendDiscordMessage({
              title,
              color: AlertColor.ERROR,
              channel: DiscordChannel.WEBHOOK_ERRORS,
              fields: [
                {
                  name: "error",
                  value: `could not restore server ${error}`,
                },
              ],
            });
          }

          await this.alert.sendDiscordMessage({
            title,
            color: AlertColor.SUCCESS,
            channel: DiscordChannel.WEBHOOK_CRITICAL,
            fields: [
              {
                name: "Success",
                value: "Node restored to operation",
              },
            ],
          });
        }

      }

      if (event === BlockChainMonitorEvents.NO_RESPONSE) {
        return await this.alert.sendDiscordMessage({
          title,
          color: AlertColor.SUCCESS,
          channel: DiscordChannel.WEBHOOK_NON_CRITICAL,
          fields: [
            {
              name: "Restored",
              value: `${chain}/${host} is now responding to requests`,
            },
          ],
        });
      }
    }


    //Retriggered 
    if (transition === EventTransitions.RE_TRIGGERED) {
      if (event == BlockChainMonitorEvents.NOT_SYNCHRONIZED) {
        return await this.alert.sendDiscordMessage({
          title,
          color: AlertColor.WARNING,
          channel: DiscordChannel.WEBHOOK_NON_CRITICAL,
          fields: [
            {
              name: "Alert",
              value: `${chain}/${host} is still out of sync`,
            },
          ],
        });
      }
      if (
        event === BlockChainMonitorEvents.NO_RESPONSE_NOT_RESOLVED ||
        event === BlockChainMonitorEvents.OFFLINE
      ) {
        if (exclude.includes(chain)) {
          return await this.alert.sendDiscordMessage({
            title,
            color: AlertColor.INFO,
            channel: DiscordChannel.WEBHOOK_NON_CRITICAL,
            fields: [
              {
                name: "Alert",
                value: `${chain}/${host} is still down and must be recovered`,
              },
            ],
          });
        }

        const url = this.getDockerEndpoint({ chain, host })

        const { data: reboot } = await this.agent.post(`http://${url}:3001/webhook/docker/reboot`, {
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

    }
  }
}