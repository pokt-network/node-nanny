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

class ProofOfConcept {
  private log: CloudWatchLogs;
  private external: ExternalHeight;
  private internal: InternalHeight;
  private disovery: Discovery;
  private config: ConfigManager;
  private today: string;
  private nextSequenceToken: string;
  constructor() {
    this.log = new CloudWatchLogs();
    this.external = new ExternalHeight();
    this.internal = new InternalHeight();
    this.disovery = new Discovery();
    this.config = new ConfigManager();
    this.today = new Date().toDateString();
    this.nextSequenceToken = "";
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

    const message = JSON.stringify({
      internal,
      external,
      delta: external - internal,
    });

    await this.setupLogs(name);

    const { nextSequenceToken } = await this.log.writeToLogStream({
      logGroupName,
      logStreamName: this.today,
      logEvents: [{ message, timestamp: Date.now() }],
      sequenceToken: this.nextSequenceToken,
    });

    this.nextSequenceToken = nextSequenceToken;
  }

  async main() {
    const nodes = await this.disovery.getListOfNodes();

    setInterval(async () => {
      for (const { name, type, ip, port, https } of nodes) {
        await this.checkNode({ name, type, ip, port, https });
      }
    }, 10000);
  }
}

new ProofOfConcept().main();
