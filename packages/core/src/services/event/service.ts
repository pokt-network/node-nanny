import { EErrorConditions, EErrorStatus, ESupportedBlockchains } from "../health/types";
import { INode, NodesModel } from "../../models";
import { AlertTypes } from "../../types";
import {
  EAlertTypes,
  ELoadBalancerStatus,
  IRedisEvent,
  IRedisEventParams,
  IToggleServerParams,
} from "./types";
import { s, is } from "../../utils";

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
    const {
      node,
      message,
      notSynced,
      status,
      title,
      downDispatchers,
    } = await this.parseEvent(eventJson, EAlertTypes.TRIGGER);
    const { chain, frontend } = node;

    await this.sendMessage(
      { title, message, chain: chain.name, frontend: Boolean(frontend) },
      status,
    );

    if (!frontend && notSynced) {
      await this.toggleServer({ node, title, enable: false });
    }

    if (this.pnf && downDispatchers?.length >= this.pnfDispatchThreshold) {
      await this.alertPocketDispatchersAreDown(downDispatchers);
      ELoadBalancerStatus;
    }
  };

  processRetriggered = async (eventJson: string): Promise<void> => {
    const {
      node,
      message,
      notSynced,
      status,
      title,
      serverCount,
      downDispatchers,
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

    if (this.pnf && downDispatchers?.length >= this.pnfDispatchThreshold) {
      await this.alertPocketDispatchersAreDown(downDispatchers);
    }
  };

  processResolved = async (eventJson: string): Promise<void> => {
    const {
      node,
      message,
      healthy,
      status,
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
  };

  /* ----- Private Methods ----- */
  private async parseEvent(
    eventJson: string,
    alertType: EAlertTypes,
  ): Promise<IRedisEventParams> {
    const event: IRedisEvent = JSON.parse(eventJson);
    const { conditions, id, status } = event;

    const node = await this.getNode(id);
    await NodesModel.updateOne({ _id: node.id }, { status, conditions });
    const { chain, backend, frontend, loadBalancers, dispatch } = node;

    const serverCount = !dispatch
      ? await this.getServerCount({ backend: frontend || backend, loadBalancers })
      : null;
    const downDispatchers =
      this.pnf && dispatch && chain.name === ESupportedBlockchains["POKT-DIS"]
        ? await this.getDownDispatchers(node)
        : null;

    const { message, statusStr } = this.getAlertMessage(
      event,
      alertType,
      serverCount,
      frontend,
      backend,
      downDispatchers,
    );

    const parsedEvent: IRedisEventParams = {
      title: `[${alertType}] - ${statusStr}`,
      message,
      node,
      healthy: conditions === EErrorConditions.HEALTHY,
      notSynced: conditions === EErrorConditions.NOT_SYNCHRONIZED,
      status,
      serverCount,
    };
    if (downDispatchers?.length) parsedEvent.downDispatchers = downDispatchers;
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

  private async toggleServer({ node, enable }: IToggleServerParams): Promise<void> {
    const { backend, chain, loadBalancers, server } = node;

    try {
      enable /* Enable or Disable Server */
        ? await this.enableServer({ backend, server, loadBalancers })
        : await this.disableServer({ backend, server, loadBalancers });

      const serverCount = !node.dispatch
        ? await this.getServerCount({ backend, loadBalancers })
        : null;
      const { title, message } = this.getRotationMessage(
        node,
        enable,
        "success",
        serverCount,
      );
      await this.alert.sendInfo({ title, message, chain: chain.name });
    } catch (error) {
      const { title, message } = this.getRotationMessage(
        node,
        enable,
        "error",
        null,
        error,
      );
      await this.alert.sendError({ title, message, chain: chain.name });
    }
  }

  private async getDownDispatchers({ chain }: INode): Promise<string[]> {
    const downDispatchNodes = await NodesModel.find({
      dispatch: true,
      chain: chain.id as any,
      status: { $ne: EErrorStatus.OK },
      conditions: { $ne: EErrorConditions.HEALTHY },
    })
      .populate({ path: "host", populate: "location" })
      .exec();

    if (downDispatchNodes?.length) {
      return downDispatchNodes.map(
        ({ name, host }) =>
          `Node: ${name} / Host: ${host.name} / Location: ${host.location.name}`,
      );
    }
  }

  private async alertPocketDispatchersAreDown(downDispatchers: string[]): Promise<void> {
    await this.alert.createPagerDutyIncident({
      title: "ALERT - Dispatchers are down!",
      details: [
        `${downDispatchers.length} dispatchers are down!`,
        `Down Dispatchers\n${downDispatchers.join("\n")}`,
      ].join("\n"),
    });
  }

  /* ----- Message String Methods ----- */
  private getAlertMessage(
    { count, conditions, name, ethSyncing, height, details }: IRedisEvent,
    alertType: EAlertTypes,
    serverCount: number,
    frontend: string,
    backend: string,
    downDispatchers: string[] = null,
  ): { message: string; statusStr: string } {
    const badOracles = details?.badOracles;
    const noOracle = details?.noOracle;

    const statusStr = `${name} is ${conditions}.`;
    const countStr =
      alertType !== EAlertTypes.RESOLVED
        ? `This event has occurred ${count} time${s(count)} since first occurrence.`
        : "";
    const ethSyncStr = ethSyncing ? `ETH Syncing: ${JSON.stringify(ethSyncing)}` : "";
    const heightStr = height
      ? `Height: ${
          typeof height === "number"
            ? height
            : `Internal: ${height.internalHeight} / External: ${height.externalHeight} / Delta: ${height.delta}`
        }`
      : "";
    let serverCountStr =
      (!downDispatchers?.length ?? serverCount) && serverCount >= 0
        ? `${serverCount} node${s(serverCount)} ${is(serverCount)} online${
            frontend || backend
              ? ` for ${frontend ? "frontend" : "backend"} ${frontend || backend}.`
              : ""
          }`
        : "";
    if (serverCount === 1) serverCountStr = `ONLY ${serverCountStr.toUpperCase()}`;
    if (serverCount === 0) serverCountStr = `NO ${serverCountStr.toUpperCase()}!!`;
    const downDispatchersStr = downDispatchers?.length
      ? [
          `${downDispatchers.length} dispatcher${s(downDispatchers.length)} ${is(
            downDispatchers.length,
          )} down:`,
          `${downDispatchers.join("\n")}`,
        ].join("\n")
      : "";
    const badOracleStr = badOracles?.length
      ? `\nWarning: Bad Oracle${s(badOracles.length)}: ${badOracles}`
      : "";
    const noOracleStr = noOracle
      ? `\nWarning: No Oracle for node. Node has ${details?.numPeers} peers.`
      : "";

    return {
      message: [
        countStr,
        ethSyncStr,
        heightStr,
        serverCountStr,
        downDispatchersStr,
        badOracleStr,
        noOracleStr,
      ]
        .filter(Boolean)
        .join("\n"),
      statusStr,
    };
  }

  private getRotationMessage(
    { backend, chain, host, loadBalancers }: INode,
    enable: boolean,
    mode: "success" | "error",
    serverCount: number,
    error?: any,
  ): { title: string; message: string } {
    const name = `${host.name}/${chain.name}`;
    const haProxyMessage = this.getHAProxyMessage({ backend, loadBalancers });
    const title = enable
      ? {
          success: `[Added] - Successfully added ${name} to rotation`,
          error: `[Error] - Could not add ${name} to rotation`,
        }[mode]
      : {
          success: `[Removed] - Successfully removed ${name} from rotation`,
          error: `[Error] - Could not remove ${name} from rotation`,
        }[mode];
    const serverCountStr =
      !!serverCount && serverCount >= 0
        ? `${serverCount} node${s(serverCount)} ${is(serverCount)} online${
            backend ? ` for backend ${backend}.` : ""
          }`
        : "";
    const message = [haProxyMessage, serverCountStr, error].filter(Boolean).join("\n");

    return { title, message };
  }
}
