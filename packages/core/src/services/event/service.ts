import { EErrorConditions, EErrorStatus, ESupportedBlockchains } from "../health/types";
import { INode, NodesModel } from "../../models";
import { s, colorLog } from "../../utils";
import { AlertTypes } from "../../types";
import {
  EAlertTypes,
  IRedisEvent,
  IRedisEventParams,
  IToggleServerParams,
} from "./types";

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

    colorLog(`[Event Triggered] ----- Start Message -----\n${message}`, "yellow");
    await this.sendMessage(
      { title, message, chain: chain.name, frontend: Boolean(frontend) },
      status,
    );

    if (!frontend && notSynced) {
      await this.toggleServer({ node, title, enable: false });
    }

    if (this.pnf && node.dispatch && chain.type === ESupportedBlockchains["POKT-DIS"]) {
      await this.alertPocketDispatchersAreDown(node);
    }

    await NodesModel.updateOne({ _id: node.id }, { status, conditions });
    colorLog("[Event Triggered] ----- End Message -----", "blue");
  };

  processRetriggered = async (eventJson: string): Promise<void> => {
    const { node, message, notSynced, status, conditions, title } = await this.parseEvent(
      eventJson,
      EAlertTypes.RETRIGGER,
    );
    const { chain, frontend } = node;
    const messageParams = {
      title,
      message,
      chain: chain.name,
      frontend: Boolean(frontend),
    };

    colorLog(`[Event Retriggered] ----- Start Message -----\n${message}`, "red");
    if (!frontend && notSynced) {
      const { backend, loadBalancers } = node;
      const count = await this.getServerCount({ backend, loadBalancers });
      await this.sendMessage(
        messageParams,
        count >= 2 ? EErrorStatus.WARNING : EErrorStatus.ERROR,
      );

      if (count >= 2) await this.toggleServer({ node, title, enable: false });
    } else {
      await this.sendMessage(messageParams, status);
    }

    if (this.pnf && node.dispatch && chain.type === ESupportedBlockchains["POKT-DIS"]) {
      await this.alertPocketDispatchersAreDown(node);
    }

    await NodesModel.updateOne({ _id: node.id }, { status, conditions });
    colorLog("[Event Retriggered] ----- End Message -----", "blue");
  };

  processResolved = async (eventJson: string): Promise<void> => {
    const {
      node,
      message,
      notSynced,
      status,
      conditions,
      title,
      warningMessage,
    } = await this.parseEvent(eventJson, EAlertTypes.RESOLVED);
    const { chain, frontend } = node;
    colorLog(`[Event Resolved] ----- Start Message -----\n${message}`, "green");

    await this.sendMessage(
      { title, message, chain: chain.name, frontend: Boolean(frontend) },
      status,
    );
    if (warningMessage && !frontend) {
      await this.sendMessage(
        {
          title,
          message: warningMessage,
          chain: chain.name,
          frontend: Boolean(frontend),
        },
        EErrorStatus.WARNING,
      );
    }

    if (!frontend && notSynced) {
      await this.toggleServer({ node, title, enable: true });
    }

    await NodesModel.updateOne({ _id: node.id }, { status, conditions });
    colorLog("[Event Resolved] ----- End Message -----", "blue");
  };

  /* ----- Private Methods ----- */
  private async parseEvent(
    eventJson: string,
    alertType: EAlertTypes,
  ): Promise<IRedisEventParams> {
    const event: IRedisEvent = JSON.parse(eventJson);
    const { conditions, id, status, sendWarning } = event;
    const { message, statusStr } = this.getAlertMessage(event, alertType);

    const parsedEvent: IRedisEventParams = {
      title: statusStr,
      message,
      node: await this.getNode(id),
      notSynced: conditions === EErrorConditions.NOT_SYNCHRONIZED,
      status,
      conditions,
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

    const message = this.getRotationMessage(node, enable, "attempt");
    await this.alert.sendInfo({ title, message, chain });

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
    { count, conditions, name, ethSyncing, height, status }: IRedisEvent,
    alertType: EAlertTypes,
  ): { message: string; statusStr: string } {
    const badOracle = conditions === EErrorConditions.BAD_ORACLE;
    const ok = status === EErrorStatus.OK;
    const conditionsStr = ok && badOracle ? EErrorConditions.HEALTHY : conditions;
    const statusStr = `${name} is ${conditionsStr}.`;
    const alertTypeStr = {
      [EAlertTypes.TRIGGER]: "First Alert",
      [EAlertTypes.RETRIGGER]: "Retriggered Alert",
      [EAlertTypes.RESOLVED]: "Event Resolved",
    }[alertType];
    const countStr =
      alertType !== EAlertTypes.RESOLVED
        ? `This event has occurred ${count} time${s(count)} since first occurrence.`
        : "";
    const badOracleStr = badOracle ? "Warning: Bad Oracle for node." : "";
    const ethSyncStr = ethSyncing ? `ETH Syncing: ${JSON.stringify(ethSyncing)}` : "";
    const heightStr = height ? `Height: ${JSON.stringify(height)}` : "";

    return {
      message: [alertTypeStr, statusStr, countStr, badOracleStr, ethSyncStr, heightStr]
        .filter(Boolean)
        .join("\n"),
      statusStr,
    };
  }

  private getWarningMessage({ conditions, name, details }: IRedisEvent): string {
    const badOracles = details?.badOracles;

    const warningStr = `${name} is ${conditions}.`;
    const bOracleStr = badOracles
      ? `Bad Oracle${s(badOracles.length)}: ${badOracles}`
      : "";

    return [warningStr, bOracleStr].filter(Boolean).join("\n");
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
