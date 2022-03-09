import BaseService from "./base-service";
import { INode } from "../../../../models";
import { IRedisEvent, IRedisEventParams, IToggleServerParams } from "./types";
import { EErrorConditions } from "../../../health/types";

export class Service extends BaseService {
  constructor() {
    super();
  }

  /* ----- Trigger Methods ----- */
  processTriggered = async (eventJson: string): Promise<void> => {
    const { title, message, node, nodeNotSynced } = await this.getEventParams(eventJson);
    await this.sendError({ title, message, chain: node.chain.name });

    if (nodeNotSynced) {
      await this.toggleServer({ node, title, enable: false });
    }
  };

  processRetriggered = async (eventJson: string): Promise<void> => {
    const { title, message, node } = await this.getEventParams(eventJson);
    await this.sendError({ title, message, chain: node.chain.name });
  };

  processResolved = async (eventJson: string): Promise<void> => {
    const { title, message, node, nodeNotSynced } = await this.getEventParams(eventJson);
    await this.sendSuccess({ title, message, chain: node.chain.name });

    if (nodeNotSynced) {
      await this.toggleServer({ node, title, enable: true });
    }
  };

  /* ----- Private Methods ----- */
  private async getEventParams(eventJson: string): Promise<IRedisEventParams> {
    const event: IRedisEvent = JSON.parse(eventJson);
    const { id, name, conditions } = event;

    return {
      title: `${name} is ${conditions}`,
      message: this.getAlertMessage(event),
      node: await this.getNode(id),
      nodeNotSynced: conditions === EErrorConditions.NOT_SYNCHRONIZED,
    };
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

    await this.sendInfo({
      title,
      message: this.getRotationMessage(node, enable, "attempt"),
      chain,
    });
    try {
      /* Enable or Disable Server */
      enable
        ? await super.enableServer({ backend, server, loadBalancers })
        : await super.disableServer({ backend, server, loadBalancers });

      await this.sendInfo({
        title,
        message: this.getRotationMessage(node, enable, "success"),
        chain,
      });
    } catch (error) {
      await this.sendInfo({
        title,
        message: this.getRotationMessage(node, enable, "error", error),
        chain,
      });
    }
  }

  /* ----- Message String Methods ----- */
  private getAlertMessage({
    count,
    conditions,
    name,
    ethSyncing,
    height,
  }: IRedisEvent): string {
    const ethSyncStr = ethSyncing ? `\nETH Syncing: ${JSON.stringify(ethSyncing)}` : "";
    const heightStr = height ? `\nHeight: ${JSON.stringify(height)}` : "";
    const s = count === 1 ? "" : "s";
    return `${name} is ${conditions}.\nThis event has occurred ${count} time${s} since first occurrence.${ethSyncStr}${heightStr}`;
  }

  private getRotationMessage(
    { backend, chain, host, loadBalancers }: INode,
    enable: boolean,
    mode: "attempt" | "success" | "error",
    error?: any,
  ): string {
    const name = `${host.name}/${chain.name}`;
    const haProxyMessage = this.getHAProxyMessage({ backend, loadBalancers });
    const errorMessage = `\nError: ${error}`;
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
