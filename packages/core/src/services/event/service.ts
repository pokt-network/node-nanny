import { AlertColor } from "../alert/types";
import { EErrorConditions, EErrorStatus } from "../health/types";
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

import Env from "../../environment";

export class Service extends BaseService {
  constructor() {
    super();
  }

  /* ----- Trigger Methods ----- */
  processTriggered = async (eventJson: string): Promise<void> => {
    const {
      node,
      message,
      notSynced,
      status,
      title,
      dispatchFrontendDown,
    } = await this.parseEvent(eventJson, EAlertTypes.TRIGGER);
    const { chain, host, backend, frontend } = node;

    /* Send alert message to Discord */
    await this.sendMessage(
      {
        title,
        message,
        chain: chain.name,
        location: host.location.name,
        frontend: Boolean(frontend),
      },
      status,
    );

    /* Remove backend node from rotation if NOT_SYNCHRONIZED */
    if (backend && !frontend && notSynced) {
      await this.toggleServer({ node, title, enable: false });
    }

    /* (PNF Internal only.) Send PagerDuty alert if Dispatcher HAProxy is down */
    if (Env("PNF") && dispatchFrontendDown) {
      await this.urgentAlertDispatchFrontendIsDown(message);
    }
  };

  processRetriggered = async (eventJson: string): Promise<void> => {
    const {
      node,
      message,
      notSynced,
      title,
      nodeCount,
      dispatchFrontendDown,
    } = await this.parseEvent(eventJson, EAlertTypes.RETRIGGER);
    const { backend, chain, host, frontend } = node;

    /* Send alert message to Discord */
    await this.sendMessage(
      {
        title,
        message,
        chain: chain.name,
        location: host.location.name,
        frontend: Boolean(frontend),
      },
      EErrorStatus.INFO,
      AlertColor.RETRIGGER,
    );

    /* Remove backend node from rotation if NOT_SYNCHRONIZED and there are at least 2 healthy nodes.
    This covers the case where the only node in rotation was out of sync and its peers catch up. */
    if (nodeCount >= 2 && backend && !frontend && notSynced) {
      await this.toggleServer({ node, title, enable: false });
    }

    /* (PNF Internal only.) Send PagerDuty alert if Dispatcher HAProxy is down */
    if (Env("PNF") && dispatchFrontendDown) {
      await this.urgentAlertDispatchFrontendIsDown(message);
    }
  };

  processResolved = async (eventJson: string): Promise<void> => {
    const { node, message, healthy, status, title } = await this.parseEvent(
      eventJson,
      EAlertTypes.RESOLVED,
    );
    const { chain, host, frontend, backend } = node;

    /* Send alert message to Discord */
    await this.sendMessage(
      {
        title,
        message,
        chain: chain.name,
        location: host.location.name,
        frontend: Boolean(frontend),
      },
      status,
    );

    /* Add backend node to rotation if HEALTHY */
    if (backend && !frontend && healthy) {
      await this.toggleServer({ node, title, enable: true });
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
    const { backend, frontend, loadBalancers, dispatch, url } = node;

    const nodeCount = await this.getServerCount({
      destination: frontend || backend,
      loadBalancers,
      frontendUrl: frontend ? url : null,
    });
    const healthy = conditions === EErrorConditions.HEALTHY;
    const notSynced =
      Env("PNF") && dispatch
        ? conditions === EErrorConditions.NOT_SYNCHRONIZED ||
          conditions === EErrorConditions.OFFLINE ||
          conditions === EErrorConditions.NO_RESPONSE
        : conditions === EErrorConditions.NOT_SYNCHRONIZED;
    const dispatchFrontendDown = Boolean(Env("PNF") && dispatch && frontend && notSynced);

    const { message, statusStr } = this.getAlertMessage(
      event,
      alertType,
      nodeCount,
      frontend || backend,
    );

    const parsedEvent: IRedisEventParams = {
      title: `[${alertType}] - ${statusStr}`,
      message,
      node,
      healthy,
      notSynced,
      status,
      nodeCount,
      dispatchFrontendDown,
    };
    return parsedEvent;
  }

  private async sendMessage(
    params: AlertTypes.IAlertParams,
    status: EErrorStatus,
    color?: AlertColor,
  ): Promise<void> {
    await {
      [EErrorStatus.OK]: () => this.alert.sendSuccess(params),
      [EErrorStatus.WARNING]: () => this.alert.sendWarn(params),
      [EErrorStatus.ERROR]: () => this.alert.sendError(params),
      [EErrorStatus.INFO]: () => this.alert.sendInfo(params, color),
    }[status]();
  }

  private async toggleServer({ node, enable }: IToggleServerParams): Promise<void> {
    const { backend, chain, host, loadBalancers, server } = node;

    try {
      enable /* Enable or Disable Server */
        ? await this.enableServer({ destination: backend, server, loadBalancers })
        : await this.disableServer({ destination: backend, server, loadBalancers });

      const nodeCount = await this.getServerCount({
        destination: backend,
        loadBalancers,
      });
      const { title, message } = this.getRotationMessage(
        node,
        enable,
        "success",
        nodeCount,
      );
      await this.sendMessage(
        { title, message, chain: chain.name, location: host.location.name },
        EErrorStatus.INFO,
      );
    } catch (error) {
      const { title, message } = this.getRotationMessage(
        node,
        enable,
        "error",
        null,
        error,
      );
      await this.sendMessage(
        { title, message, chain: chain.name, location: host.location.name },
        EErrorStatus.ERROR,
      );
    }
  }

  private async urgentAlertDispatchFrontendIsDown(message: string): Promise<void> {
    await this.alert.createPagerDutyIncident({
      title: "URGENT ALERT! Dispatch Frontend is down!",
      details: ["Dispatchers' HAProxy frontend is down!", message].join("\n"),
    });
  }

  /* ----- Message String Methods ----- */
  private getAlertMessage(
    { count, conditions, name, ethSyncing, height, details }: IRedisEvent,
    alertType: EAlertTypes,
    nodeCount: number,
    destination: string,
  ): { message: string; statusStr: string } {
    const badOracles = details?.badOracles?.join("\n");
    const noOracle = details?.noOracle;

    const statusStr = `${name} is ${conditions}.`;
    const countStr =
      alertType !== EAlertTypes.RESOLVED
        ? `This event has occurred ${count} time${s(count)} since first occurrence.`
        : "";
    const ethSyncStr = ethSyncing ? `ETH Syncing: ${JSON.stringify(ethSyncing)}` : "";
    const heightStr = height
      ? `Height - ${
          typeof height === "number"
            ? height
            : `Internal: ${height.internalHeight} / External: ${height.externalHeight} / Delta: ${height.delta}`
        }`
      : "";
    let serverCountStr =
      nodeCount && nodeCount >= 0
        ? `${nodeCount} node${s(nodeCount)} ${is(
            nodeCount,
          )} in rotation for ${destination}.`
        : "";
    if (nodeCount <= 1) serverCountStr = `${serverCountStr.toUpperCase()}`;
    const badOracleStr = badOracles?.length
      ? `\nWarning - Bad Oracle${s(badOracles.length)}\n${badOracles}`
      : "";
    const noOracleStr = noOracle
      ? `\nWarning - No Oracle for node. Node has ${details?.numPeers} peers.`
      : "";

    return {
      message: [countStr, ethSyncStr, heightStr, badOracleStr, noOracleStr]
        .filter(Boolean)
        .join("\n"),
      statusStr,
    };
  }

  private getRotationMessage(
    { backend, chain, host, loadBalancers }: INode,
    enable: boolean,
    mode: "success" | "error",
    nodeCount: number,
    error?: any,
  ): { title: string; message: string } {
    const name = `${host.name}/${chain.name}`;
    const haProxyMessage = this.getHAProxyMessage({
      destination: backend,
      loadBalancers,
    });
    const title = enable
      ? {
          success: `[Added] - Successfully added ${name} to rotation`,
          error: `[Error] - Could not add ${name} to rotation`,
        }[mode]
      : {
          success: `[Removed] - Successfully removed ${name} from rotation`,
          error: `[Error] - Could not remove ${name} from rotation`,
        }[mode];
    let serverCountStr =
      nodeCount && nodeCount >= 0
        ? `${nodeCount} node${s(nodeCount)} ${is(nodeCount)} in rotation for ${
            backend ? `backend ${backend}.` : ""
          }`
        : "";
    if (nodeCount <= 1) serverCountStr = `${serverCountStr.toUpperCase()}`;
    const message = [haProxyMessage, serverCountStr, error].filter(Boolean).join("\n");

    return { title, message };
  }
}
