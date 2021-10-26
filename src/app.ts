import { Health, Log } from "./services";
import { NodesModel } from "./models";
import { wait } from "./utils";
import { connect } from "./db";

export class App {
  private health: Health;
  private log: Log;
  constructor() {
    this.log = new Log();
    this.health = new Health();
  }

  async main() {
    await connect();
    const nodes = await NodesModel.find({}).exec();
    const allHealth = await this.health.getNodeHealth(nodes);

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
