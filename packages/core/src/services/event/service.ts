import { EErrorConditions, EErrorStatus, ESupportedBlockchains } from "../health/types";
import { INode, NodesModel } from "../../models";
import { AlertTypes, HealthTypes } from "../../types";
import {
  EAlertTypes,
  ELoadBalancerStatus,
  IRedisEvent,
  IRedisEventParams,
  IToggleServerParams,
} from "./types";
import { s } from "../../utils";

import { Service as BaseService } from "../base-service/base-service";

export class Service extends BaseService {
  private pnf: boolean;
  private pnfDispatchThreshold: number;

  constructor() {
    super();
    this.pnf = Boolean(process.env.PNF === "1");
    this.pnfDispatchThreshold = Number(process.env.PNF_DISPATCH_THRESHOLD || 5);
  }

  /* ----- Trigger Methods ----- */
  processTriggered = async (eventJson: string): Promise<void> => {
    const { node, message, notSynced, status, conditions, title } = await this.parseEvent(
      eventJson,
      EAlertTypes.TRIGGER,
    );
    const { chain, frontend } = node;

    await this.sendMessage(
      { title, message, chain: chain.name, frontend: Boolean(frontend) },
      status,
    );

    if (!frontend && notSynced) {
      await this.toggleServer({ node, title, enable: false });
    }

    if (this.pnf && node.dispatch && chain.type === ESupportedBlockchains["POKT-DIS"]) {
      await this.alertPocketDispatchersAreDown(node);
      ELoadBalancerStatus;
    }

    await NodesModel.updateOne({ _id: node.id }, { status, conditions });
  };

  processRetriggered = async (eventJson: string): Promise<void> => {
    const {
      node,
      message,
      notSynced,
      status,
      conditions,
      title,
      serverCount,
    } = await this.parseEvent(eventJson, EAlertTypes.RETRIGGER);
    const { backend, chain, frontend, loadBalancers, server } = node;

    const messageParams = {
      title,
      message,
      chain: chain.name,
      frontend: Boolean(frontend),
    };

    if (!frontend && notSynced) {
      await this.sendMessage(
        messageParams,
        serverCount >= 2 ? EErrorStatus.WARNING : EErrorStatus.ERROR,
      );

      const onlineStatus = await this.getServerStatus({ backend, server, loadBalancers });
      if (serverCount >= 2 && onlineStatus === ELoadBalancerStatus.ONLINE) {
        await this.toggleServer({ node, title, enable: false });
      }
    } else {
      await this.sendMessage(messageParams, status);
    }

    if (this.pnf && node.dispatch && chain.type === ESupportedBlockchains["POKT-DIS"]) {
      await this.alertPocketDispatchersAreDown(node);
    }

    await NodesModel.updateOne({ _id: node.id }, { status, conditions });
  };

  processResolved = async (eventJson: string): Promise<void> => {
    const {
      node,
      message,
      healthy,
      status,
      conditions,
      title,
      warningMessage,
    } = await this.parseEvent(eventJson, EAlertTypes.RESOLVED);
    const { chain, frontend, backend, server, loadBalancers } = node;

    await this.sendMessage(
      { title, message, chain: chain.name, frontend: Boolean(frontend) },
      status,
    );
    if (warningMessage && !frontend) {
      await this.sendMessage(
        {
          title: "Warning",
          message: warningMessage,
          chain: chain.name,
          frontend: Boolean(frontend),
        },
        EErrorStatus.WARNING,
      );
    }

    if (!frontend && healthy) {
      const onlineStatus = await this.getServerStatus({ backend, server, loadBalancers });
      if (onlineStatus === ELoadBalancerStatus.OFFLINE) {
        await this.toggleServer({ node, title, enable: true });
      }
    }

    await NodesModel.updateOne({ _id: node.id }, { status, conditions });
  };

  /* ----- Private Methods ----- */
  private async parseEvent(
    eventJson: string,
    alertType: EAlertTypes,
  ): Promise<IRedisEventParams> {
    const event: IRedisEvent = JSON.parse(eventJson);
    const { conditions, id, status, sendWarning } = event;

    const node = await this.getNode(id);
    const { backend, loadBalancers } = node;
    const serverCount = await this.getServerCount({ backend, loadBalancers });
    const { message, statusStr } = this.getAlertMessage(event, alertType, serverCount);

    const parsedEvent: IRedisEventParams = {
      title: `[${alertType}] - ${statusStr}`,
      message,
      node,
      healthy: conditions === EErrorConditions.HEALTHY,
      notSynced: conditions === EErrorConditions.NOT_SYNCHRONIZED,
      status,
      conditions,
      serverCount,
    };
    if (sendWarning) parsedEvent.warningMessage = this.getWarningMessage(event);
    return parsedEvent;
  }

  private async sendMessage(
    params: AlertTypes.IAlertParams,
    status: EErrorStatus,
  ): Promise<void> {
    await {
      [EErrorStatus.OK]: () => this.alert.sendSuccess(params),
      [EErrorStatus.WARNING]: () => this.alert.sendWarn(params),
      [EErrorStatus.ERROR]: () => this.alert.sendError(params),
    }[status]();
  }

  private async toggleServer({
    node,
    title,
    enable,
  }: IToggleServerParams): Promise<void> {
    const {
      backend,
      chain: { name: chain },
      loadBalancers,
      server,
    } = node;

    try {
      enable /* Enable or Disable Server */
        ? await this.enableServer({ backend, server, loadBalancers })
        : await this.disableServer({ backend, server, loadBalancers });

      const message = this.getRotationMessage(node, enable, "success");
      await this.alert.sendSuccess({ title, message, chain });
    } catch (error) {
      const message = this.getRotationMessage(node, enable, "error", error);
      await this.alert.sendError({ title, message, chain });
    }
  }

  private async alertPocketDispatchersAreDown(node: INode): Promise<void> {
    const downDispatchers = await this.checkPocketDispatchPeers(node);
    const dispatchUrls = downDispatchers.map(({ url }) => `${url}\n`);

    if (downDispatchers?.length >= this.pnfDispatchThreshold) {
      await this.alert.createPagerDutyIncident({
        title: "ALERT - Dispatchers are down!",
        details: [
          `${downDispatchers.length} dispatchers are down!`,
          `Down Dispatchers: ${dispatchUrls}`,
        ].join("\n"),
      });
    }
  }

  private async checkPocketDispatchPeers({ chain }: INode): Promise<INode[]> {
    return NodesModel.find({
      dispatch: true,
      chain: chain.id,
      status: { $ne: EErrorStatus.OK },
      conditions: { $ne: EErrorConditions.HEALTHY },
    });
  }

  /* ----- Message String Methods ----- */
  private getAlertMessage(
    { count, conditions, name, ethSyncing, height, details }: IRedisEvent,
    alertType: EAlertTypes,
    serverCount: number,
  ): { message: string; statusStr: string } {
    const badOracle = details?.badOracles;
    const noOracle = details?.noOracle;

    const statusStr = `${name} is ${conditions}.`;
    const countStr =
      alertType !== EAlertTypes.RESOLVED
        ? `This event has occurred ${count} time${s(count)} since first occurrence.`
        : "";
    const badOracleStr = badOracle ? "Warning: Bad Oracle for node." : "";
    const noOracleStr = noOracle
      ? `Warning: No Oracle for node. Node has ${details?.numPeers} peers.`
      : "";
    const ethSyncStr = ethSyncing ? `ETH Syncing: ${JSON.stringify(ethSyncing)}` : "";
    const heightStr = height
      ? `Block Height - ${
          typeof height === "number"
            ? height
            : `Internal: ${height.internalHeight} External: ${height.externalHeight} Delta: ${height.delta}`
        }`
      : "";
    const serverCountStr = `${serverCount} server${s(serverCount)} online.`;

    return {
      message: [
        countStr,
        badOracleStr,
        noOracleStr,
        ethSyncStr,
        heightStr,
        serverCountStr,
      ]
        .filter(Boolean)
        .join("\n"),
      statusStr,
    };
  }

  private getWarningMessage({ details }: IRedisEvent): string {
    const badOracles = details?.badOracles;
    const noOracle = details?.noOracle;

    const bOracleStr = badOracles
      ? `Bad Oracle${s(badOracles.length)}: ${badOracles}`
      : "";
    const noOracleStr = noOracle
      ? `Warning: No Oracle for node. Node has ${details?.numPeers} peers.`
      : "";

    return [bOracleStr, noOracleStr].filter(Boolean).join("\n");
  }

  private getRotationMessage(
    { backend, chain, host, loadBalancers }: INode,
    enable: boolean,
    mode: "attempt" | "success" | "error",
    error?: any,
  ): string {
    const name = `${host.name}/${chain.name}`;
    const haProxyMessage = this.getHAProxyMessage({ backend, loadBalancers });
    const errorMessage = `\n${error}`;
    return enable
      ? {
          attempt: `Attempting to add ${name} to rotation.\n${haProxyMessage}`,
          success: `Successfully added ${name} to rotation.\n${haProxyMessage}`,
          error: `Could not add ${name} to rotation.\n${haProxyMessage}${errorMessage}`,
        }[mode]
      : {
          attempt: `Attempting to remove ${name} from rotation.\n${haProxyMessage}`,
          success: `Successfully removed ${name} from rotation.\n${haProxyMessage}`,
          error: `Could not remove ${name} from rotation.\n${haProxyMessage}${errorMessage}`,
        }[mode];
  }
}
