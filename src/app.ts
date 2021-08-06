import { Discover, Health, Log } from "./services";
import { DiscoverTypes } from "./types";
import { wait } from "./utils";

export class App {
  private discover: Discover;
  private health: Health;
  private log: Log;
  constructor() {
    this.discover = new Discover({ source: DiscoverTypes.Source.TAG });
    this.log = new Log();
    this.health = new Health();
  }

  async main() {
    let { dataNodes, pocketNodes } = await this.discover.getNodes();

    const pocketHealth = await this.health.getPocketNodesHealth(pocketNodes);

    const dataHealth = await this.health.getDataNodesHealth(dataNodes);

    const allHealth = pocketHealth.concat(dataHealth);

    for (const health of allHealth) {
      if (health) {
        await wait(500);
        let message = JSON.stringify(health);
        const { name } = health;
        console.info({ name, health });
        await this.log.write({ message, name });
      }
    }
    return;
  }
}
