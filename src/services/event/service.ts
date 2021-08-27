import axios, { AxiosInstance } from "axios";

import { DataDog, Alert, Config } from "..";
import { AlertColor } from "../datadog/types";
import {
  DataDogMonitorStatus,
  DiscordChannel,
  BlockChainMonitorEvents,
  EventTransitions,
  EventTypes,
  LoadBalancerHosts,
  Hosts,
  SupportedBlockChains,
} from "./types";

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
    const { Value: monitorId } = await this.config.getMonitorId({ chain, host: peer });
    return (await this.dd.getMonitorStatus(monitorId)) !== DataDogMonitorStatus.ALERT;
  }
  async disableServer({ hostname, backend, host, chain }) {
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
  async processEvent(raw) {
    const {
      event,
      color,
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
      await this.config.setNodeStatus({ chain, host, status: "online" });
    }

    if (type === EventTypes.ERROR && transition === EventTransitions.TRIGGERED) {
      if (event === BlockChainMonitorEvents.NOT_SYNCHRONIZED && status === "online") {
        await this.alert.sendDiscordMessage({
          title,
          color: Number(color),
          channel: DiscordChannel.WEBHOOK_TEST,
          fields: [
            {
              name: "Error",
              value: `${chain}/${host} is ${event} \n See event ${link}`,
            },
          ],
        });

        const isPeerOk = await this.isPeerOk({ chain, host });

        if (!isPeerOk) {
          await this.alert.sendDiscordMessage({
            title,
            color: Number(color),
            channel: DiscordChannel.WEBHOOK_TEST,
            fields: [
              {
                name: "CRITICAL ERROR!",
                value: `Both ${chain} nodes are unhealthy`,
              },
            ],
          });
          return;
        }
        if (isPeerOk) {
          await this.alert.sendDiscordMessage({
            title,
            color: AlertColor.INFO,
            channel: DiscordChannel.WEBHOOK_TEST,
            fields: [
              {
                name: "Fixing",
                value: `Removing ${chain}/${host} from load balancer`,
              },
            ],
          });

          const hostname = LoadBalancerHosts[host.toUpperCase()];

          try {
            await this.disableServer({ hostname, backend, host, chain });
            await this.config.setNodeStatus({ chain, host, status: "offline" });
            await this.alert.sendDiscordMessage({
              title,
              color: AlertColor.INFO,
              channel: DiscordChannel.WEBHOOK_TEST,
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
              channel: DiscordChannel.WEBHOOK_TEST,
              fields: [
                {
                  name: "error",
                  value: `could not remove server ${error}`,
                },
              ],
            });
          }
        }
      }
    }
    if (event === BlockChainMonitorEvents.NOT_SYNCHRONIZED && status === "offline") {
      await this.alert.sendDiscordMessage({
        title,
        color: AlertColor.ERROR,
        channel: DiscordChannel.WEBHOOK_TEST,
        fields: [
          {
            name: "error",
            value: "Node is still out of synch",
          },
        ],
      });
    }
    if (event === BlockChainMonitorEvents.HEALTHY && status === "offline") {
      await this.config.setNodeStatus({ chain, host, status: "online" });
      await this.alert.sendDiscordMessage({
        title,
        color: AlertColor.INFO,
        channel: DiscordChannel.WEBHOOK_TEST,
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
          channel: DiscordChannel.WEBHOOK_TEST,
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
          channel: DiscordChannel.WEBHOOK_TEST,
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
        channel: DiscordChannel.WEBHOOK_TEST,
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

