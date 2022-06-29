import { FilterQuery } from 'mongoose';

import { AlertColor } from '../alert/types';
import { Service as BaseService } from '../base-service/base-service';
import { EErrorConditions, EErrorStatus, ESupportedBlockchains } from '../health/types';
import { INode, NodesModel } from '../../models';
import {
  EAlertTypes,
  IRedisEvent,
  IRedisEventParams,
  IToggleServerParams,
} from './types';
import { AlertTypes } from '../../types';
import { colorLog } from '../../utils';

import env from '../../environment';

export class Service extends BaseService {
  constructor() {
    super();
  }

  /* ----- Trigger Methods ----- */
  processTriggered = async (eventJson: string): Promise<void> => {
    let nodeName: string;

    try {
      const { node, message, notSynced, status, title, dispatchFrontendDown } =
        await this.parseEvent(eventJson, EAlertTypes.TRIGGER);
      const { name, automation, chain, host, backend, frontend, muted } = node;
      nodeName = name;

      /* Send alert message to Discord */
      if (!muted) {
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
      }

      /* Remove backend node from rotation if NOT_SYNCHRONIZED */
      if (automation && backend && !frontend && notSynced) {
        await this.toggleServer({ node, enable: false });
      }

      /* (PNF Internal only) Send PagerDuty alert if Dispatcher HAProxy is down */
      if (env('PNF') && dispatchFrontendDown) {
        await this.urgentAlertDispatchFrontendIsDown(message);
      }
    } catch (error) {
      this.parseError(error, 'TRIGGERED', nodeName);
    }
  };

  processRetriggered = async (eventJson: string): Promise<void> => {
    let nodeName: string;

    try {
      const { node, message, notSynced, title, nodesOnline, dispatchFrontendDown } =
        await this.parseEvent(eventJson, EAlertTypes.RETRIGGER);
      const { name, automation, backend, chain, host, frontend, muted } = node;
      nodeName = name;

      /* Send alert message to Discord */
      if (!muted) {
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
      }

      /* Remove backend node from rotation if NOT_SYNCHRONIZED and there are at least 2 healthy nodes.
    This covers the case where the only node in rotation was out of sync and its peers catch up. */
      if (automation && nodesOnline >= 2 && backend && !frontend && notSynced) {
        await this.toggleServer({ node, enable: false });
      }

      /* (PNF Internal only) Send PagerDuty alert if Dispatcher HAProxy is down */
      if (env('PNF') && dispatchFrontendDown) {
        await this.urgentAlertDispatchFrontendIsDown(message);
      }
    } catch (error) {
      this.parseError(error, 'RETRIGGERED', nodeName);
    }
  };

  processResolved = async (eventJson: string): Promise<void> => {
    let nodeName: string;

    try {
      const { node, message, healthy, status, title } = await this.parseEvent(
        eventJson,
        EAlertTypes.RESOLVED,
      );
      const { name, automation, chain, host, frontend, backend, muted } = node;
      nodeName = name;

      /* Send alert message to Discord */
      if (!muted) {
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
      }

      /* Add backend node to rotation if HEALTHY */
      if (automation && backend && !frontend && healthy) {
        await this.toggleServer({ node, enable: true });
      }
    } catch (error) {
      this.parseError(error, 'RESOLVED', nodeName);
    }
  };

  /* ----- Private Methods ----- */
  private async parseEvent(
    eventJson: string,
    alertType: EAlertTypes,
  ): Promise<IRedisEventParams> {
    const event: IRedisEvent = JSON.parse(eventJson);
    const { conditions, id, status } = event;

    const update: FilterQuery<INode> = { status, conditions };
    if (alertType === EAlertTypes.TRIGGER) {
      update.erroredAt = Date.now();
    }
    await NodesModel.updateOne({ _id: id }, update);
    const node = await this.getNode(id);
    const {
      automation,
      backend,
      chain,
      erroredAt,
      frontend,
      loadBalancers,
      dispatch,
      url,
    } = node;
    if (erroredAt && alertType === EAlertTypes.RESOLVED) {
      await NodesModel.updateOne({ _id: id }, { $unset: { erroredAt: 1 } });
    }

    const pnfDispatch =
      env('PNF') && dispatch && chain.name === ESupportedBlockchains['POKT-DIS'];

    const healthy = conditions === EErrorConditions.HEALTHY;
    const notSynced = pnfDispatch
      ? this.dispatchNotSyncedConditions.includes(conditions)
      : this.notSyncedConditions.includes(conditions);
    const dispatchFrontendDown = Boolean(pnfDispatch && frontend && notSynced);

    const { online: nodesOnline, total: nodesTotal } =
      automation && (frontend || backend)
        ? await this.getServerCount({
            destination: frontend || backend,
            loadBalancers,
            frontendUrl: frontend ? url : null,
            dispatch: pnfDispatch,
          })
        : { online: null, total: null };

    const { message, statusStr } = this.alert.getAlertMessage(
      event,
      alertType,
      nodesOnline,
      nodesTotal,
      frontend || backend,
      erroredAt,
    );

    const parsedEvent: IRedisEventParams = {
      title: `[${alertType}] - ${statusStr}`,
      message,
      node,
      healthy,
      notSynced,
      status,
      nodesOnline,
      nodesTotal,
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
    const { backend, chain, dispatch, host, loadBalancers, server } = node;

    try {
      const serverToggled = enable /* Enable or Disable Server */
        ? await this.enableServer({ destination: backend, server, loadBalancers })
        : await this.disableServer({ destination: backend, server, loadBalancers });

      if (serverToggled) {
        const { online: nodesOnline, total: nodesTotal } = await this.getServerCount({
          destination: backend,
          loadBalancers,
          dispatch,
        });

        const { title, message } = this.alert.getRotationMessage(
          node,
          enable,
          'success',
          nodesOnline,
          nodesTotal,
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
        'error',
        null,
        error,
      );
      await this.sendMessage(
        { title, message, chain: chain.name, location: host.location.name },
        EErrorStatus.ERROR,
      );
    }
  }

  private parseError(error: any, type: string, nodeName: string): void {
    let errorMessage: string;
    if (error?.stack) {
      const [message, location] = error.stack.split('\n');
      const nodeNameStr = nodeName ? ` Node: ${nodeName} ` : '';
      errorMessage = `[EVENT CONSUMER ERROR - ${type}]${nodeNameStr}${message} ${location}`;
    } else {
      errorMessage = `[EVENT CONSUMER ERROR - ${type}] ${error}`;
    }
    colorLog(errorMessage, 'yellow');
  }

  /** These conditions will trigger Node Nanny to remove the node from circulation. */
  private notSyncedConditions = [
    EErrorConditions.NOT_SYNCHRONIZED,
    EErrorConditions.ERROR_RESPONSE,
  ];

  /* ----- PNF Internal Only ----- */
  /** These conditions will trigger Node Nanny to remove a dispatch node from circulation */
  private dispatchNotSyncedConditions = [
    ...this.notSyncedConditions,
    EErrorConditions.OFFLINE,
    EErrorConditions.NO_RESPONSE,
  ];

  /** Pager Duty alert will be sent if there is no dispatch service available through the dispatch HAProxy */
  private async urgentAlertDispatchFrontendIsDown(message: string): Promise<void> {
    await this.alert.createPagerDutyIncident({
      title: 'URGENT ALERT! Dispatch Frontend is down!',
      details: ["Dispatchers' HAProxy frontend is down!", message].join('\n'),
    });
  }
}
