import { Discover, Health, Log } from "./services";
import { DiscoverTypes, HealthTypes } from "./types";
import { wait } from "./utils";
export class App {
  private discover: Discover;
  private health: Health;
  private log: Log;
  private supported: string[];
  constructor() {
    this.discover = new Discover({ source: DiscoverTypes.Source.TAG });
    this.log = new Log();
    this.health = new Health();
  }

  async main() {
    let nodes = await this.discover.getNodes();
    const response = [];
    for (const { node, peer, external } of nodes) {
      await wait(2000);
      const health = await this.health.getNodeHealth({ node, peer, external });
      const { name } = node
      console.info({ name, health });
      response.push({ name, health });
      const message = JSON.stringify(health);
      const { logGroupName, logStreamName, sequenceToken } = await this.log.setupLogs(name);
      await this.log.writeToLogStream({
        logGroupName,
        logStreamName,
        sequenceToken,
        logEvents: [{ message, timestamp: Date.now() }],
      });
    }
    return response;


  }
}
