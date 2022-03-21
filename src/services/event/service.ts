import axios, { AxiosInstance } from "axios";
import { DataDog, Alert } from "..";
import {
  DataDogMonitorStatus,
  BlockChainMonitorEvents,
  EventTransitions,
  LoadBalancerStatus,
  SupportedBlockChains,
  PocketTypes,
} from "./types";
import { INode, NodesModel, HostsModel } from "../../models";

/**
 *
 * This class functions as an event consumer for DataDog alerts.
 * Events are dependant on parsing format in parseWebhookMessage in the DataDog Service */

export class Service {
  private agent: AxiosInstance;
  private alert: Alert;
  private dd: DataDog;
  private threshold: number;

  constructor() {
    this.agent = this.initAgentClient();
    this.alert = new Alert();
    this.dd = new DataDog();
    this.threshold = 2;
  }

  private initAgentClient() {
    return axios.create({
      headers: { "Content-Type": "application/json" },
    });
  }

  private getLoadBalancerIP(ip: string): string {
    if (process.env.MONITOR_TEST === "1") return "localhost";
    return ip;
  }

  async isPeersOk({ chain, nodeId }) {
    console.log("isPeersOk", chain, nodeId);
    //todo this is just a temp fix for the pocket nodes, needs more sophistiacted handling to check peers
    if (
      chain.toUpperCase() === SupportedBlockChains.POKT ||
      chain.toUpperCase() === "POKT-DIS" ||
      chain.toUpperCase() === "POKT-MAIN" ||
      chain.toUpperCase() === "POKT-BT"
    ) {
      return true;
    }

    const peers: INode[] = await NodesModel.find({
      "chain.name": chain.toUpperCase(),
      _id: { $ne: nodeId },
    });

    const peerStatus = await Promise.all(
      peers.map(async ({ monitorId }) => {
        return await this.dd.getMonitorStatus(monitorId);
      }),
    );

    return !peerStatus.every((value) => value === DataDogMonitorStatus.ALERT);
  }

  async checkPocketPeers({ nodeId, poktType }) {
    const peers: INode[] = await NodesModel.find({
      "chain.name": "POKT",
      poktType,
      _id: { $ne: nodeId },
    });
    const peerStatus = await Promise.all(
      peers.map(async ({ monitorId }) => {
        return await this.dd.getMonitorStatus(monitorId);
      }),
    );
    return peerStatus.filter((value) => value === DataDogMonitorStatus.ALERT).length;
  }

  async disableServer({ backend, server, loadBalancers }) {
    try {
      const status = await this.getBackendServerStatus({ backend, server, loadBalancers });
      const count = await this.getBackendServerCount(backend, loadBalancers);
      if (count <= 1) {
        return await this.alert.sendErrorChannel({
          title: backend,
          message: `could not remove ${server} from load balancer, ${count} server online \n
          manual intervention required`,
        });
      }

      if (status === LoadBalancerStatus.OFFLINE) {
        return await this.alert.sendErrorChannel({
          title: backend,
          message: `could not remove from load balancer, server already offline`,
        });
      }
      return await Promise.all(
        loadBalancers.map(async ({ internalHostName }) =>
          this.agent.post(
            `http://${this.getLoadBalancerIP(internalHostName)}:3001/webhook/lb/disable`,
            { backend, server },
          ),
        ),
      );
    } catch (error) {
      this.alert.sendErrorChannel({
        title: backend,
        message: `could not remove from load balancer, ${error}`,
      });
    }
  }

  async enableServer({ backend, server, loadBalancers }) {
    try {
      return await Promise.all(
        loadBalancers.map(({ internalHostName }) =>
          this.agent.post(
            `http://${this.getLoadBalancerIP(internalHostName)}:3001/webhook/lb/enable`,
            { backend, server },
          ),
        ),
      );
    } catch (error) {
      return this.alert.sendErrorChannel({
        title: backend,
        message: `could not contact agent to enable , ${error}`,
      });
    }
  }

  async rebootServer({ host, container, monitorId, chain, compose, nginx, poktType }) {
    const Host = await HostsModel.findOne({ name: host.name });

    if (!!Host) {
      let { internalIpaddress: ip } = Host;

      if (process.env.MONITOR_TEST === "1") {
        ip = "localhost";
      }

      let reboot;
      try {
        if (chain.type === SupportedBlockChains.POKT) {
          const { data } = await this.agent.post(`http://${ip}:3001/webhook/docker/reboot`, {
            name: container,
            type: "pokt",
            nginx,
            poktType,
          });
          reboot = data.reboot;
        } else {
          const { data } = await this.agent.post(`http://${ip}:3001/webhook/docker/reboot`, {
            name: container,
            type: "data",
            compose: process.env.MONITOR_TEST === "1" ? "mock" : compose,
          });

          reboot = data.reboot;
        }
        await this.dd.muteMonitor({ id: monitorId, minutes: 5 });
        return reboot;
      } catch (error) {
        console.log(error);
        throw new Error(`could not reboot ${container} ${error}`);
      }
    }
    throw new Error("Host not found");
  }

  async restartService({ host, service, monitorId }) {
    const Host = await HostsModel.findOne({ name: host.name });

    if (!!Host) {
      let { internalIpaddress: ip } = Host;
      try {
        const { data } = await this.agent.post(`http://${ip}:3001/webhook/service/restart`, {
          service,
        });
        await this.dd.muteMonitor({ id: monitorId, minutes: 20 });
        return data;
      } catch (error) {
        throw new Error(`could not contact agent ${error}`);
      }
    }
    throw new Error("Host not found");
  }

  async getBackendServerStatus({ backend, server, loadBalancers }) {
    const results = [];

    for (const { internalHostName } of loadBalancers) {
      try {
        const { data } = await this.agent.post(
          `http://${this.getLoadBalancerIP(internalHostName)}:3001/webhook/lb/status`,
          { backend, server },
        );
        results.push(data);
      } catch (error) {
        throw new Error(`could not get backend status, ${internalHostName} ${backend} ${error}`);
      }
    }

    if (results.every(({ status }) => status === true)) {
      return LoadBalancerStatus.ONLINE;
    }

    if (results.every(({ status }) => status === false)) {
      return LoadBalancerStatus.OFFLINE;
    }

    return LoadBalancerStatus.ERROR;
  }

  async getBackendServerCount(backend, loadBalancers) {
    let results = [];
    for (const { internalHostName } of loadBalancers) {
      try {
        const { data } = await this.agent.post(
          `http://${this.getLoadBalancerIP(internalHostName)}:3001/webhook/lb/count`,
          { backend },
        );
        results.push(data);
      } catch (error) {
        throw new Error(`could not get backend status, ${internalHostName} ${backend} ${error}`);
      }
    }

    results = results.map(({ status }) => status);

    if (results.every((count) => count === results[0])) {
      return results[0];
    }
    return -1;
  }

  async getHAProxyMessage(backend, hosts) {
    const urls = hosts
      .map((host) => {
        return `http://${this.getLoadBalancerIP(
          host.externalHostName,
        )}:8050/stats/;up?scope=${backend} \n`;
      })
      .join("");
    return `HAProxy status\n${urls}`;
  }

  isOnTime(timestamp: number, miliseconds: number): boolean {
    return new Date().getTime() - new Date(timestamp).getTime() > miliseconds;
  }

  async processEvent(raw) {
    const { event, nodeId, transition, title, link, timestamp } = await this.dd.parseWebhookMessage(
      raw,
    );

    if (this.isOnTime(timestamp, 120000)) {
      return this.alert.sendErrorChannel({
        title: "webhook is late",
        message: title,
      });
    }

    const node: INode = await NodesModel.findOne({ _id: nodeId });
    const {
      backend,
      server,
      haProxy,
      reboot,
      poktType,
      removeNoResponse,
      docker,
      container,
      loadBalancers,
    } = node;
    const chain = node.chain.name.toLowerCase();
    const host = node.host.name.toLowerCase();
    const name = node.hostname ? node.hostname : `${chain}/${host}/${container}`;
    /*++++++++++++++++++++++++TRIGGERED++++++++++++++++++++++++++++++++ */
    if (transition === EventTransitions.TRIGGERED) {
      //alert if both unhealthy
      if (!(await this.isPeersOk({ chain, nodeId }))) {
        await this.alert.sendError({
          title,
          message: `All ${chain} nodes are unhealthy! \n 
           See event ${link} \n
            ${await this.getHAProxyMessage(backend, loadBalancers)}`,
          chain,
        });
      }

      /*============================NOT_SYNCHRONIZED===================================  */
      if (event === BlockChainMonitorEvents.NOT_SYNCHRONIZED) {
        await this.alert.sendError({
          title,
          message: `${name} is ${event} \n See event ${link}`,
          chain,
        });

        // if (!hasPeer) {
        //   await this.alert.sendError({
        //     title: `${name} is ${event}`,
        //     message: `${chain} node is not synched \n
        //     This node does not have a peer \n
        //     Manual intervention is required! \n
        //      See event ${link} \n`,
        //     chain,
        //   });
        // }

        if (!(await this.isPeersOk({ chain, nodeId }))) {
          await this.alert.sendError({
            title: `${name} is ${event}`,
            message: `All ${chain} nodes are not synched \n 
            Manual intervention is required! \n
             See event ${link} \n
              ${await this.getHAProxyMessage(backend, loadBalancers)}`,
            chain,
          });
        }

        if (haProxy) {
          await this.disableServer({ backend, server, loadBalancers });
          await this.alert.sendInfo({
            title,
            message: `Removed ${name} from load balancer, it will be restored once healthy again \n
              ${await this.getHAProxyMessage(backend, loadBalancers)}`,
            chain,
          });
        }
      }

      /*============================NO_RESPONSE and OFFLINE POKT ==========================*/
      if (
        node.chain.type === SupportedBlockChains.POKT &&
        (event === BlockChainMonitorEvents.NO_RESPONSE || event === BlockChainMonitorEvents.OFFLINE)
      ) {
        const badCount = await this.checkPocketPeers({ nodeId, poktType });

        if (poktType === PocketTypes.DISPATCH && badCount >= this.threshold) {
          await this.alert.createPagerDutyIncident({
            title: "Dispatchers are down!",
            details: `${badCount} dispatchers are down!`,
          });
        }
      }

      /*============================NO_RESPONSE and OFFLINE Remove from LB (BT Solana) ==========================*/

      if (
        (event === BlockChainMonitorEvents.OFFLINE ||
          event === BlockChainMonitorEvents.NO_RESPONSE) &&
        removeNoResponse
      ) {
        await this.disableServer({ backend, server, loadBalancers });
        await this.alert.sendInfo({
          title,
          message: `Removed ${name}from load balancer, it will be restored once healthy again \n
            ${await this.getHAProxyMessage(backend, loadBalancers)}`,
          chain,
        });
      }

      /*============================NO_RESPONSE===================================  */
      if (event === BlockChainMonitorEvents.NO_RESPONSE) {
        if (haProxy) {
          return await this.alert.sendWarn({
            title,
            message: `${name} status is ${event} \n
            See event ${link} \n
            ${await this.getHAProxyMessage(backend, loadBalancers)}`,
            chain,
          });
        }

        if (!haProxy) {
          return await this.alert.sendError({
            title,
            message: `${name} status is ${event} \n
            See event ${link}`,
            chain,
          });
        }
      }

      /*============================OFFLINE==================================*/
      if (event === BlockChainMonitorEvents.OFFLINE) {
        return await this.alert.sendError({
          title,
          message: `${name} status is ${event} \n 
            See event ${link} \n
            ${await this.getHAProxyMessage(backend, loadBalancers)}`,
          chain,
        });
      }

      /*============================NO PEERS==================================*/
      if (event === BlockChainMonitorEvents.NO_PEERS) {
        return await this.alert.sendError({
          title,
          message: `${name} status is ${event} \n 
            See event ${link} \n`,
          chain,
        });
      }
      /*============================PEER NOT SYNCRONIZED==================================*/

      if (event === BlockChainMonitorEvents.PEER_NOT_SYNCHRONIZED) {
        return await this.alert.sendInfo({
          title,
          message: `${name} status is ${event} \n`,
          chain,
        });
      }
    }

    /*++++++++++++++++++++++++RE_TRIGGERED++++++++++++++++++++++++++++++++ */
    if (transition === EventTransitions.RE_TRIGGERED) {
      //jan 21, turning off eth pd out now we have ample nodes to suppport more than one down, will be revamped to alert when theres a real problem
      // if (node.chain.name === SupportedBlockChains.ETH) {
      //   await this.alert.createPagerDutyIncident({
      //     title: "Problem with Ethereum Node!",
      //     details: `${title}\n${event}\n${link}`,
      //     service: AlertTypes.PagerDutyServices.NODE_INFRA,
      //   });
      // }
      if (event == BlockChainMonitorEvents.NOT_SYNCHRONIZED) {
        /*============================NOT_SYNCHRONIZED==========================*/
        return this.alert.sendWarn({ title, message: `${name} is still out of sync`, chain });
      }
      /*============================NO_RESPONSE and OFFLINE ==========================*/
      if (
        event === BlockChainMonitorEvents.NO_RESPONSE ||
        event === BlockChainMonitorEvents.OFFLINE
      ) {
        if (!reboot) {
          return this.alert.sendInfo({
            title,
            message: `${name} is still down and must be recovered`,
            chain,
          });
        }
        if (reboot && docker) {
          try {
            const reboot = await this.rebootServer(node);
            return this.alert.sendInfo({
              title,
              message: `rebooting ${name} \n${reboot ? reboot : ""}`,
              chain,
            });
          } catch (error) {
            return this.alert.sendInfo({
              title,
              message: `attempted to reboot${name} \n reboot failed \n manual intervention required \n ${
                reboot ? reboot : ""
              }`,
              chain,
            });
          }
        }

        if (reboot && !docker) {
          await this.restartService(node);
          return this.alert.sendInfo({
            title,
            message: `restarting ${name} \n`,
            chain,
          });
        }

        if (node.chain.type === SupportedBlockChains.POKT) {
          const badCount = await this.checkPocketPeers({ nodeId, poktType });
          if (poktType === PocketTypes.DISPATCH && badCount >= this.threshold) {
            await this.alert.createPagerDutyIncident({
              title: "Dispatchers are down!",
              details: `${badCount} dispatchers are down!`,
            });
          }
        }
      }

      /*============================NO PEERS==================================*/
      if (event === BlockChainMonitorEvents.NO_PEERS) {
        return await this.alert.sendError({
          title,
          message: `${name} status is ${event} \n 
            See event ${link} \n`,
          chain,
        });
      }
      /*============================PEER NOT SYNCRONIZED==================================*/

      if (event === BlockChainMonitorEvents.PEER_NOT_SYNCHRONIZED) {
        return await this.alert.sendInfo({
          title,
          message: `${name} status is ${event} \n`,
          chain,
        });
      }
    }

    /*++++++++++++++++++++++++RECOVERED+++++++++++++++++++++++++++++++++++++++++++++++++++++ */
    if (transition === EventTransitions.RECOVERED) {
      /*============================NOT_SYNCHRONIZED==========================*/
      if (event === BlockChainMonitorEvents.NOT_SYNCHRONIZED) {
        await this.alert.sendSuccess({ title, message: `${name} has recovered!`, chain });
        if (haProxy) {
          await this.enableServer({ backend, server, loadBalancers });
          await this.alert.sendSuccess({
            title,
            message: `
              Restored \n
              Added ${name} back to load balancer \n
              ${await this.getHAProxyMessage(backend, loadBalancers)}`,
            chain,
          });
        }
        return await this.alert.sendSuccess({
          title,
          message: "Node restored to operation",
          chain,
        });
      }

      /*============================NO_RESPONSE and OFFLINE ==========================*/
      if (
        event === BlockChainMonitorEvents.NO_RESPONSE ||
        event === BlockChainMonitorEvents.OFFLINE
      ) {
        if (removeNoResponse) {
          await this.enableServer({ backend, server, loadBalancers });
          await this.alert.sendInfo({
            title,
            message: `Restored \n Added ${name} back to rotation \n
              ${await this.getHAProxyMessage(backend, loadBalancers)}`,
            chain,
          });
        }

        return await this.alert.sendSuccess({
          title,
          message: `${name} is now responding to requests`,
          chain,
        });
      }

      /*============================NO PEERS==================================*/
      if (event === BlockChainMonitorEvents.NO_PEERS) {
        return await this.alert.sendError({
          title,
          message: `${name} status is ${event} \n 
                  See event ${link} \n`,
          chain,
        });
      }
      /*============================PEER NOT SYNCRONIZED==================================*/

      if (event === BlockChainMonitorEvents.PEER_NOT_SYNCHRONIZED) {
        return await this.alert.sendInfo({
          title,
          message: `${name} status is ${event} \n`,
          chain,
        });
      }
    }
  }
}
