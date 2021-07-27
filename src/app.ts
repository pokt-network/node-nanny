import { Discover } from "./services";
import { DiscoverTypes } from "./types";
import { Health } from "./services";
import { HealthTypes } from "./types";

export class App {
  private discover: Discover;
  private health: Health;
  private supported: string[];
  constructor() {
    this.discover = new Discover({ source: DiscoverTypes.Source.TAG });
    this.health = new Health();
    this.supported = Object.keys(HealthTypes.EthVariants)
  }

  async main() {
    let nodes = await this.discover.getListOfNodes();
    nodes = nodes.filter(({type}) => this.supported.includes(type))
    console.table(nodes)
    for (const { name, type, ip, port } of nodes) {
      const health = await this.health.getNodeHealth({ name, type, ip, port });
      console.log(name, health);
    }
  }
}
