import dotenv from "dotenv";
import {
  CloudWatchLogs,
  ExternalHeight,
  InternalHeight,
  Discovery,
  ConfigManager,
} from "./services";
import { hexToDec } from "./utils";

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
  SYNC = "Sync",
}

enum SupportedChains {
  ETH = "Eth",
}

class ProofOfConcept {
  private log: CloudWatchLogs;
  private external: ExternalHeight;
  private internal: InternalHeight;
  private discovery: Discovery;
  private config: ConfigManager;
  private today: string;
  constructor() {
    this.log = new CloudWatchLogs();
    this.external = new ExternalHeight();
    this.internal = new InternalHeight();
    this.discovery = new Discovery();
    this.config = new ConfigManager();
    this.today = new Date().toDateString();
  }

  async setupLogs(name) {
    const logGroupName = `/Pocket/NodeMonitoring/${name}`;
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

    return external - internal > Number(currentConfig) ? SyncStatusErrorLevel.ERROR : SyncStatusErrorLevel.SYNCHRONIZED;
  }

  async checkNode({ name, type, ip, port, https }) {
    const logGroupName = `/Pocket/NodeMonitoring/${name}`;

    let [{ result: internal }, { result: external }] = await Promise.all([
      this.internal.getBlockHeight({
        ip,
        https: Boolean(https),
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

  async main() {
    const nodes = await this.discovery.getListOfNodes();

    setInterval(async () => {
      for (const { name, type, ip, port, https } of nodes) {
        await this.checkNode({ name, type, ip, port, https });
      }
    }, 10000);
  }
}

new ProofOfConcept().main();
