import { AlertColor } from "../alert/types";
import { Service as BaseService } from "../base-service/base-service";
import { EErrorConditions, EErrorStatus } from "../health/types";
import { NodesModel } from "../../models";
import {
  EAlertTypes,
  IRedisEvent,
  IRedisEventParams,
  IToggleServerParams,
} from "./types";
import { AlertTypes } from "../../types";
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
    const pnfDispatch = env("PNF") && dispatch;

    const healthy = conditions === EErrorConditions.HEALTHY;
    const notSynced = pnfDispatch
      ? conditions === EErrorConditions.NOT_SYNCHRONIZED ||
        conditions === EErrorConditions.OFFLINE ||
        conditions === EErrorConditions.NO_RESPONSE
      : conditions === EErrorConditions.NOT_SYNCHRONIZED;
    const dispatchFrontendDown = Boolean(pnfDispatch && frontend && notSynced);

    const nodeCount = await this.getServerCount({
      destination: frontend || backend,
      loadBalancers,
      frontendUrl: frontend ? url : null,
      dispatch: pnfDispatch,
    });
    const nodeTotal = await NodesModel.count({ chain: chain.id, haProxy: true });

    const { message, statusStr } = this.alert.getAlertMessage(
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

        const { title, message } = this.alert.getRotationMessage(
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
      const { title, message } = this.alert.getRotationMessage(
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
}
