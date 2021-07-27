import { Discover } from "./services";
import { DiscoverTypes } from "./types";
import { Health } from "./services";

export class App {
  private discover: Discover;
  private health: Health;
  constructor() {
    this.discover = new Discover({ source: DiscoverTypes.Source.TAG });
    this.health = new Health();
  }

  async main() {
    const nodes = await this.discover.getListOfNodes();
    for (const { name, type, ip, port } of nodes) {
      const health = await this.health.getNodeHealth({ name, type, ip, port });
      console.log(name, health);
    }
  }
}
