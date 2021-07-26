import dotenv from "dotenv";
import {
  CloudWatchLogs,
  ConfigManager,
  Discovery,
  Discord,
  ExternalAPI,
  InternalHeight,
  RPC,
  PagerDuty,
} from "./services";

import { IncidentLevel } from "./services/pagerduty";
import { hexToDec, wait } from "./utils";

dotenv.config();

enum ErrorConditions {
  FORCED = "forced",
}

enum SyncStatusErrorLevel {
  SYNCHRONIZED = "SYNCHRONIZED",
  WARNING = "WARNING",
  ERROR = "ERROR",
}

enum ConfigParams {
  SYNC = "sync",
}

enum SupportedChains {
  ETH = "eth-mainnet",
}

enum Source {
  CSV = "csv",
  TAG = "tag",
}

enum LogGroupPrefix {
  BASE = `/Pocket/NodeMonitoring/`,
}

enum ErrorMessages {
  NODE_DOWN_TITLE = "Node down!",
}

class App {
  private rpc: RPC;
  private log: CloudWatchLogs;
  private external: ExternalAPI;
  private internal: InternalHeight;
  private discovery: Discovery;
  private discord: Discord;
  private config: ConfigManager;
  private today: string;
  private pd: PagerDuty;
  constructor() {
    this.rpc = new RPC();
    this.log = new CloudWatchLogs();
    this.external = new ExternalAPI();
    this.internal = new InternalHeight();
    this.discovery = new Discovery({ source: Source.TAG });
    this.discord = new Discord();
    this.config = new ConfigManager();
    this.today = new Date().toDateString();
    this.pd = new PagerDuty();
  }

  async setupLogs(name) {
    const logGroupName = `${LogGroupPrefix.BASE}${name}`;
    const groupExists = await this.log.doesLogGroupExist(logGroupName);
    if (!groupExists) {
      await this.log.createLogGroup(logGroupName);
    }
    const streamExist = await this.log.doesLogStreamExist({
      logGroupName,
      logStreamName: this.today,
    });
    if (!streamExist) {
      await this.log.createLogStream({ logGroupName, logStreamName: this.today });
    }
    //Optimization, we should not have to call the describe method on every invocation since the next token is supply by the putLogs call
    return this.log.getSequenceTokenForLogStream({ logGroupName, logStreamName: this.today });
  }

  //Optimization, eventually we will want to fetch the configuration via subscription or a on less frequent interval
  async evaluateSyncHealth({
    chain,
    internal,
    external,
  }: {
    chain: SupportedChains;
    internal: number;
    external: number;
  }) {
    const currentConfig = await this.config.getParam({ chain, param: ConfigParams.SYNC });
    if (currentConfig === ErrorConditions.FORCED) {
      return SyncStatusErrorLevel.ERROR;
    }

    return external - internal > Number(currentConfig)
      ? SyncStatusErrorLevel.ERROR
      : SyncStatusErrorLevel.SYNCHRONIZED;
  }

  async checkNode({ name, type, ip, port, https }) {
    const logGroupName = `${LogGroupPrefix.BASE}${name}`;
    let [{ result: internal }, { result: external }] = await Promise.all([
      this.internal.getBlockHeight({
        ip,
        https: https,
        port: Number(port),
      }),
      this.external.getBlockHeight(type),
    ]);

    internal = hexToDec(internal);
    external = hexToDec(external);

    const status = await this.evaluateSyncHealth({
      chain: SupportedChains.ETH,
      internal,
      external,
    });

    const message = JSON.stringify({
      internal,
      external,
      delta: external - internal,
      status,
    });

    const sequenceToken = await this.setupLogs(name);

    await this.log.writeToLogStream({
      logGroupName,
      logStreamName: this.today,
      logEvents: [{ message, timestamp: Date.now() }],
      sequenceToken,
    });
    console.log("sync status captured", message);
  }

  async isNodeOnline({ ip, port, name }) {
    const status = await this.rpc.isNodeOnline({ host: ip, port });
    if (status) return true;
    if (!status) {
      const message = `Cannot reach ${name} on ${ip}:${port}, this node appears to be offline!`;

      await this.pd.createIncident({
        title: ErrorMessages.NODE_DOWN_TITLE,
        urgency: IncidentLevel.HIGH,
        details: message,
      });

      await this.discord.sendMessage(message);
      return false;
    }
  }
  async main() {
    let nodes = await this.discovery.getListOfNodes();

    const onlineNodes = [];

    console.log("checking if nodes are online");
    for (const node of nodes) {
      const { ip, port, name } = node;
      await wait(2000);
      const status = await this.isNodeOnline({ ip, port, name });
      if (status) {
        onlineNodes.push(node);
      }
    }
    console.log("processing the following list of nodes");
    console.table(onlineNodes);

    setInterval(async () => {
      for (const { name, type, ip, port, https } of nodes) {
        await this.checkNode({ name, type, ip, port, https });
      }
    }, 10000);
  }
}

new App().main();
