import { Alert, Discover, Health, Log } from "./services";
import { DiscoverTypes, HealthTypes, AlertTypes } from "./types";
import { wait } from "./utils";
export class App {
  private alert: Alert;
  private discover: Discover;
  private health: Health;
  private log: Log;
  constructor() {
    this.alert = new Alert();
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
      await wait(1000);
      let message = JSON.stringify(health);
      const { name } = health;
      console.info({ name, health });
      
      await this.log.write({ message, name });

      if (health.status === HealthTypes.ErrorStatus.ERROR) {
        if (health.conditions === HealthTypes.ErrorConditions.OFFLINE) {
          await this.alert.sendAlert({
            channel: AlertTypes.AlertChannel.DISCORD,
            title: AlertTypes.Titles.OFFLINE,
            details: `Node ${name} is currently offline`,
          });
        }

        if (health.conditions === HealthTypes.ErrorConditions.NOT_SYNCHRONIZED) {
          await this.alert.sendAlert({
            channel: AlertTypes.AlertChannel.DISCORD,
            title: AlertTypes.Titles.NOT_SYNCHRONIZED,
            details: `Node ${name} is currently not in synch ${message}}`,
          });
        }
      }
    }
    return;
  }
}
