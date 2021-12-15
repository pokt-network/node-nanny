import axios, { AxiosInstance } from "axios";
import { DataDog, Alert } from "..";
import { AlertTypes } from "../../types";
import {
  DataDogMonitorStatus,
  BlockChainMonitorEvents,
  EventTransitions,
  LoadBalancerStatus,
  Limits,
  LoadBalancer,
  SupportedBlockChains,
  PocketTypes,
} from "./types";
import { INode, NodesModel, HostsModel } from "../../models";

/**
 * This class functions as an event consumer for DataDog alerts.
 * Events are dependant on parsing format in parseWebhookMessage in the DataDog Service
 */

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

  async getLoadBalancers(): Promise<LoadBalancer[]> {
    if (process.env.MONITOR_TEST === "1") {
      return [
        {
          internalHostName: "ip-10-0-0-102.us-east-2.compute.internal",
          externalHostName: "ec2-18-118-59-87.us-east-2.compute.amazonaws.com",
        },
        {
          internalHostName: "ip-10-0-0-85.us-east-2.compute.internal",
          externalHostName: "ec2-18-189-159-188.us-east-2.compute.amazonaws.com",
        },
      ];
    }

    return await HostsModel.find(
      { loadBalancer: true },
      { internalHostName: 1, externalHostName: 1 },
    ).exec();
  }

  async isPeersOk({ chain, nodeId }) {
    //todo this is just a temp fix for the pocket nodes, needs more sophistiacted handling to check peers
    if (chain.toUpperCase() === SupportedBlockChains.POKT) {
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

  async disableServer({ backend, server }) {
    try {
      const status = await this.getBackendServerStatus({ backend, server });
      const count = await this.getBackendServerCount(backend);
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

      const loadBalancers = await this.getLoadBalancers();
      return await Promise.all(
        loadBalancers.map(async ({ internalHostName }) =>
          this.agent.post(`http://${internalHostName}:3001/webhook/lb/disable`, {
            backend,
            server,
          }),
        ),
      );
    } catch (error) {
      this.alert.sendErrorChannel({
        title: backend,
        message: `could not remove from load balancer, ${error}`,
      });
    }
  }

  async enableServer({ backend, server }) {
    try {
      const loadBalancers = await this.getLoadBalancers();
      return await Promise.all(
        loadBalancers.map(({ internalHostName }) =>
          this.agent.post(`http://${internalHostName}:3001/webhook/lb/enable`, {
            backend,
            server,
          }),
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

  async getBackendServerStatus({ backend, server }) {
    const loadBalancers = await this.getLoadBalancers();
    const results = [];
    for (const { internalHostName } of loadBalancers) {
      try {
        const { data } = await this.agent.post(
          `http://${internalHostName}:3001/webhook/lb/status`,
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

  async getBackendServerCount(backend) {
    const loadBalancers = await this.getLoadBalancers();
    let results = [];
    for (const { internalHostName } of loadBalancers) {
      try {
        const { data } = await this.agent.post(`http://${internalHostName}:3001/webhook/lb/count`, {
          backend,
        });
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

  async getHAProxyMessage(backend) {
    const hosts = await this.getLoadBalancers();
    const urls = hosts
      .map((host) => {
        return `http://${host.externalHostName}:8050/stats/;up?scope=${backend} \n`;
      })
      .join("");
    return `HAProxy status\n${urls}`;
  }

  async processEvent(raw) {
    const { event, nodeId, transition, title, link } = await this.dd.parseWebhookMessage(raw);
    const node: INode = await NodesModel.findOne({ _id: nodeId });
    const {
      backend,
      server,
      haProxy,
      reboot,
      hasPeer,
      poktType,
      removeNoResponse,
      docker,
    } = node;
    const chain = node.chain.name.toLowerCase();
    const host = node.host.name.toLowerCase();
    const name = node.hostname ? node.hostname : `${chain}/${host}`;

    /*++++++++++++++++++++++++TRIGGERED++++++++++++++++++++++++++++++++ */
    if (transition === EventTransitions.TRIGGERED) {
      if (node.chain.name === SupportedBlockChains.ETH) {
        await this.alert.createPagerDutyIncident({
          title: "Problem with Ethereum Node!",
          details: `${title}\n${event}\n${link}`,
          service: AlertTypes.PagerDutyServices.NODE_INFRA,
        });
      }

      //alert if both unhealthy
      if (!(await this.isPeersOk({ chain, nodeId })) && hasPeer) {
        await this.alert.sendError({
          title,
          message: `All ${chain} nodes are unhealthy! \n 
           See event ${link} \n
            ${await this.getHAProxyMessage(backend)}`,
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

        if (!hasPeer) {
          await this.alert.sendError({
            title: `${name} is ${event}`,
            message: `${chain} node is not synched \n 
            This node does not have a peer \n
            Manual intervention is required! \n
             See event ${link} \n`,
            chain,
          });
        }

        if (!(await this.isPeersOk({ chain, nodeId })) && hasPeer) {
          await this.alert.sendError({
            title: `${name} is ${event}`,
            message: `All ${chain} nodes are not synched \n 
            Manual intervention is required! \n
             See event ${link} \n
              ${await this.getHAProxyMessage(backend)}`,
            chain,
          });
        }

        if (haProxy && hasPeer) {
          await this.disableServer({ backend, server });
          await this.alert.sendInfo({
            title,
            message: `Removed ${name} from load balancer, it will be restored once healthy again \n
              ${await this.getHAProxyMessage(backend)}`,
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
        await this.disableServer({ backend, server });
        await this.alert.sendInfo({
          title,
          message: `Removed ${name}from load balancer, it will be restored once healthy again \n
            ${await this.getHAProxyMessage(backend)}`,
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
            ${await this.getHAProxyMessage(backend)}`,
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
            ${await this.getHAProxyMessage(backend)}`,
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
          const reboot = await this.rebootServer(node);
          return this.alert.sendInfo({
            title,
            message: `rebooting ${name} \n${reboot ? reboot : ""}`,
            chain,
          });
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
        if (haProxy && hasPeer) {
          await this.enableServer({ backend, server });
          await this.alert.sendSuccess({
            title,
            message: `
              Restored \n
              Added ${name} back to load balancer \n
              ${await this.getHAProxyMessage(backend)}`,
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
          await this.enableServer({ backend, server });
          await this.alert.sendInfo({
            title,
            message: `Restored \n Added ${name} back to rotation \n
              ${await this.getHAProxyMessage(backend)}`,
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
