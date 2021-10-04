import { Discover, Health, Log } from "./services";
import { DiscoverTypes } from "./types";
import { wait } from "./utils";
import { connect } from "./db";

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
    await connect()
    const nodes = await this.discover.getNodesfromDB()
    const allHealth = await this.health.getNodeHealth(nodes)

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
