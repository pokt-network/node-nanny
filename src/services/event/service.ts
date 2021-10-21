import axios, { AxiosInstance } from "axios";
import { DataDog, Alert } from "..";
import {
  DataDogMonitorStatus,
  BlockChainMonitorEvents,
  EventTransitions,
  LoadBalancerStatus,
  Limits,
  LoadBalancer
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
  constructor() {
    this.agent = this.initAgentClient();
    this.alert = new Alert();
    this.dd = new DataDog();
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
          internalHostName: 'ip-10-0-0-102.us-east-2.compute.internal',
          externalHostName: "ec2-18-118-59-87.us-east-2.compute.amazonaws.com"
        },
        {

          internalHostName: 'ip-10-0-0-85.us-east-2.compute.internal',
          externalHostName: "ec2-18-189-159-188.us-east-2.compute.amazonaws.com"
        }
      ]
    }

    return await HostsModel.find({ loadBalancer: true }, { internalHostName: 1, externalHostName: 1 }).exec()
  }

  private async isPeerOk({ chain, nodeId }) {
    const peers: INode[] = await NodesModel.find({ 'chain.name': chain.toUpperCase(), _id: { $ne: nodeId } })
    const peerStatus = await Promise.all(peers.map(async ({ monitorId }) => {
      return await this.dd.getMonitorStatus(monitorId)

    }))

    return !(peerStatus.every((value) => value === DataDogMonitorStatus.ALERT))
  }

  async disableServer({ backend, server }) {
    try {
      const status = await this.getBackendStatus(backend)
      if (status === LoadBalancerStatus.ONLINE) {
        const loadBalancers = await this.getLoadBalancers()
        return await Promise.all(loadBalancers.map(async ({ internalHostName }) => this.agent.post(`http://${internalHostName}:3001/webhook/lb/disable`, { backend, host: server })))

      } else {
        this.alert.sendErrorChannel({ title: backend, message: `could not remove from load balancer, some servers already offline, ${JSON.stringify(status)}` })
      }
    } catch (error) {
      this.alert.sendErrorChannel({ title: backend, message: `could not remove from load balancer, ${error}` })
    }
  }

  async enableServer({ backend, server }) {
    try {
      const loadBalancers = await this.getLoadBalancers()
      return await Promise.all(loadBalancers.map(({ internalHostName }) => this.agent.post(`http://${internalHostName}:3001/webhook/lb/enable`, { backend, host: server })))

    } catch (error) {
      this.alert.sendErrorChannel({ title: backend, message: `could not contact agent to enable , ${error}` })
    }
  }

  async rebootServer({ host, container, id }) {
    const Host = await HostsModel.findOne({ name: host})
    if (!!Host) {
      let { internalIpaddress: ip } = Host
      if (process.env.MONITOR_TEST === "1") {
        ip = 'localhost'
      }
      const { data } = await this.agent.post(`http://${ip}:3001/webhook/docker/reboot`, {
        name: container,
      });
      const { reboot } = data
      await this.dd.muteMonitor({ id, minutes: 5 });
      return reboot
    }
    return;
  }

  async getBackendStatus(backend) {
    const loadBalancers = await this.getLoadBalancers()
    const results = []
    for (const { internalHostName } of loadBalancers) {
      try {
        const { data } = await this.agent.post(`http://${internalHostName}:3001/webhook/lb/status`, { backend })
        results.push(data)
      } catch (error) {
        throw new Error(`could not getbackendstatus, ${internalHostName} ${backend} ${error}`)
      }
    }
    if (results.every((result) => result.status.allOnline === true)) {
      return LoadBalancerStatus.ONLINE
    }
    return results
  }


  async getBlockHeightDifference({ chain, host, nodeId, logGroup }) {
    const [peer]: INode[] = await NodesModel.find({ 'chain.name': chain.toUpperCase(), _id: { $ne: nodeId } })
    let logs = await this.dd.getHealthLogs({ logGroup, host })
    let peerLogs = await this.dd.getHealthLogs({ logGroup: peer.logGroup, host: peer.host.name.toLowerCase() })
    logs = logs.concat(peerLogs)
    logs = logs.sort((a, b) => a.delta - b.delta)
    return { worst: logs[0], best: logs[logs.length - 1] }
  }

  async getHAProxyMessage(backend) {
    const hosts = await this.getLoadBalancers()
    const urls = hosts.map((host) => {
      return `http://${host.externalHostName}:8050/;up?scope=${backend} \n`
    }).join('')
    return `HAProxy status\n${urls}`
  }

  async processEvent(raw) {
    const {
      event,
      id,
      nodeId,
      transition,
      title,
      link,
    } = await this.dd.parseWebhookMessage(raw);

    const node: INode = await NodesModel.findOne({ _id: nodeId })
    const { backend, container, logGroup, server, haProxy, reboot } = node
    const chain = node.chain.name.toLowerCase();
    const host = node.host.name.toLowerCase();
    const name = node.hostname ? node.hostname : `${chain}/${host}`
    const docker = node.host.dockerHost
    let instance = node.host.hostType === "AWS" ? node.host.awsInstanceId : node.host.name

    if (transition === EventTransitions.TRIGGERED) {
      //alert if both unhealthy
      if (!await this.isPeerOk({ chain, nodeId })) {
        await this.alert.sendErrorCritical({
          title, message:
            `Both ${chain} nodes are unhealthy! \n 
           See event ${link} \n
            ${await this.getHAProxyMessage(backend)}`
        })
      }

      //Send logs to discord on every error
      const logs = await this.dd.getContainerLogs({ instance, container })

      const fields = logs.map(({ service, timestamp, message }) => {
        return {
          name: `${timestamp}-${service}`,
          value: `${`${message.length > Limits.MAX_LOG ? Limits.MAX_LOG_MSG : message}`}`
        }
      })

      await this.alert.sendLogs({ title, fields })

      //Not Syncronized and the node is in operation
      if (event === BlockChainMonitorEvents.NOT_SYNCHRONIZED) {
        await this.alert.sendErrorCritical({ title, message: `${name} is ${event} \n See event ${link}` })
        if (!await this.isPeerOk({ chain, nodeId })) {
          //Both nodes are out of sync
          let { worst, best } = await this.getBlockHeightDifference({ chain, host, nodeId, logGroup })
          if (haProxy) {
            const badPeer = await NodesModel.findOne({ "chain.name": chain.toUpperCase(), "host.name": worst.host })
            const status = await this.getBackendStatus(backend)
            if (status === LoadBalancerStatus.ONLINE) {
              await this.disableServer({ backend, server: badPeer.server });
              return await this.alert.sendInfo({
                title, message:
                  `Removed ${chain}/${badPeer.hostname ? badPeer.hostname : `${badPeer.chain.name}/${badPeer.host.name}`} from load balancer,\n
                   It will be restored once healthy again \n
                   The best node is ${best.delta} blocks out of sync \n
                   Best: ${JSON.stringify(best)} \n
                   Worst: ${JSON.stringify(worst)}\n
                  ${await this.getHAProxyMessage(backend)}`
              })
            }
          }
          return this.alert.sendInfo({
            title, message: `
                One node already removed!\n
                Best:${JSON.stringify(best)} \n
                Worst: ${JSON.stringify(worst)}\n
                ${await this.getHAProxyMessage(backend)}`
          })
        }

        if (haProxy) {
          await this.disableServer({ backend, server });
          await this.alert.sendInfo({
            title,
            message: `Removed ${name} from load balancer, it will be restored once healthy again \n
              ${await this.getHAProxyMessage(backend)}`
          })
        }
      }
      if (event === BlockChainMonitorEvents.NO_RESPONSE) {
        await this.alert.sendWarn({
          title, message:
            `${name} status is ${event} \n
            See event ${link} \n
            ${await this.getHAProxyMessage(backend)}`
        })

      }
      if (event === BlockChainMonitorEvents.OFFLINE) {
        return await this.alert.sendErrorCritical({
          title, message:
            `${name} status is ${event} \n 
            See event ${link} \n
            ${await this.getHAProxyMessage(backend)}`
        })
      }
    }

    if (transition === EventTransitions.RECOVERED) {
      if (event === BlockChainMonitorEvents.NOT_SYNCHRONIZED) {
        if (!await this.isPeerOk({ chain, nodeId })) {

          //one has recoved but bad node may be primary, swap them in this case
          const status = await this.getBackendStatus(backend)
          const peer = await NodesModel.findOne({ "chain.name": chain.toUpperCase(), _id: { $ne: nodeId } })

          if (haProxy && status !== LoadBalancerStatus.ONLINE) {
            await this.enableServer({ backend, server })
            await this.disableServer({ backend, server: peer.server })
          }

          return this.alert.sendWarn({
            title, message: `${name} has recovered \n
            ${chain} /${peer.hostname ? peer.hostname : peer.host.name} is still out of sync and was removed
          `})
        }

        await this.alert.sendSuccess({ title, message: `${name} has recovered!` })

        //this case is to put the node back into rotation
        await this.alert.sendInfo({
          title, message: `Node is in Synch \n
            ${name} will be added back to the load balancer \n
            ${await this.getHAProxyMessage(backend)}`
        })

        if (haProxy) {
          await this.enableServer({ backend, server });
          await this.alert.sendSuccess({
            title, message: `
              Restored \n
              Added ${name} back to load balancer \n`
          })
        }
        return await this.alert.sendSuccessToCritical({
          title, message: "Node restored to operation"
        })
      }
      if (event === BlockChainMonitorEvents.NO_RESPONSE) {
        return await this.alert.sendSuccess({ title, message: `${name} is now responding to requests` })
      }
    }

    if (transition === EventTransitions.RE_TRIGGERED) {
      if (event == BlockChainMonitorEvents.NOT_SYNCHRONIZED) {
        return this.alert.sendWarn({ title, message: `${name} is still out of sync` })
      }
      if (
        event === BlockChainMonitorEvents.NO_RESPONSE ||
        event === BlockChainMonitorEvents.OFFLINE
      ) {
        if (!reboot) {
          return this.alert.sendInfo({ title, message: `${name} is still down and must be recovered` })
        }
        if (reboot && docker) {
          const reboot = await this.rebootServer({ host, container, id })
          return this.alert.sendInfo({
            title, message: `rebooting ${name} \n${reboot ? reboot : ''}`
          })
        }
      }
    }
  }
}