import { AlertColor } from "../alert/types";
import { Service as BaseService } from "../base-service/base-service";
import { EErrorConditions, EErrorStatus } from "../health/types";
import { INode, NodesModel } from "../../models";
import {
  EAlertTypes,
  IRedisEvent,
  IRedisEventParams,
  IToggleServerParams,
} from "./types";
import { AlertTypes } from "../../types";
import { s, is } from "../../utils";
import env from "../../environment";

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
      await this.toggleServer({ node, enable: false });
    }

    /* (PNF Internal only) Send PagerDuty alert if Dispatcher HAProxy is down */
    if (env("PNF") && dispatchFrontendDown) {
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
      await this.toggleServer({ node, enable: false });
    }

    /* (PNF Internal only) Send PagerDuty alert if Dispatcher HAProxy is down */
    if (env("PNF") && dispatchFrontendDown) {
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
      await this.toggleServer({ node, enable: true });
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
    const { chain, backend, frontend, loadBalancers, dispatch, url } = node;

    const healthy = conditions === EErrorConditions.HEALTHY;
    const notSynced =
      env("PNF") && dispatch
        ? conditions === EErrorConditions.NOT_SYNCHRONIZED ||
          conditions === EErrorConditions.OFFLINE ||
          conditions === EErrorConditions.NO_RESPONSE
        : conditions === EErrorConditions.NOT_SYNCHRONIZED;
    const dispatchFrontendDown = Boolean(env("PNF") && dispatch && frontend && notSynced);

    const nodeCount = await this.getServerCount({
      destination: frontend || backend,
      loadBalancers,
      frontendUrl: frontend ? url : null,
    });
    const nodeTotal = await NodesModel.count({ chain: chain.id });

    const { message, statusStr } = this.getAlertMessage(
      event,
      alertType,
      nodeCount,
      nodeTotal,
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
      nodeTotal,
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
      const serverToggled = enable /* Enable or Disable Server */
        ? await this.enableServer({ destination: backend, server, loadBalancers })
        : await this.disableServer({ destination: backend, server, loadBalancers });

      if (serverToggled) {
        const nodeCount = await this.getServerCount({
          destination: backend,
          loadBalancers,
        });
        const nodeTotal = await NodesModel.count({ chain: chain.id });

        const { title, message } = this.getRotationMessage(
          node,
          enable,
          "success",
          nodeCount,
          nodeTotal,
        );
        await this.sendMessage(
          { title, message, chain: chain.name, location: host.location.name },
          EErrorStatus.INFO,
        );
      }
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

  /* ----- PNF Internal Only ----- */
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
    nodeTotal: number,
    destination: string,
  ): { message: string; statusStr: string } {
    const badOracles = details?.badOracles?.join("\n");
    const noOracle = details?.noOracle;

    const statusStr = `${name} is ${conditions}.`;
    const countStr =
      alertType !== EAlertTypes.RESOLVED
        ? `This event has occurred ${count} time${s(count)} since first occurrence.`
        : "";
    const ethSyncStr = ethSyncing ? `ETH Syncing - ${ethSyncing}` : "";
    const heightStr = height
      ? `Height - ${
          typeof height === "number"
            ? height
            : `Internal: ${height.internalHeight} / External: ${height.externalHeight} / Delta: ${height.delta}`
        }`
      : "";
    let nodeCountStr =
      nodeCount && nodeCount >= 0
        ? `${nodeCount} of ${nodeTotal} node${s(nodeTotal)} ${is(
            nodeCount,
          )} in rotation for ${destination}.`
        : "";
    if (nodeCount <= 1) nodeCountStr = `${nodeCountStr.toUpperCase()}`;
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
    nodeTotal: number,
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
    let nodeCountStr =
      nodeCount && nodeCount >= 0
        ? `${nodeCount} of ${nodeTotal} node${s(nodeTotal)} ${is(
            nodeCount,
          )} in rotation for ${backend}.`
        : "";
    if (nodeCount <= 1) nodeCountStr = `${nodeCountStr.toUpperCase()}`;
    const message = [haProxyMessage, nodeCountStr, error].filter(Boolean).join("\n");

    return { title, message };
  }
}
