import { Discover, Health } from "./services";
import { DiscoverTypes, HealthTypes } from "./types";

export class App {
  private discover: Discover;
  private health: Health;
  private supported: string[];
  constructor() {
    this.discover = new Discover({ source: DiscoverTypes.Source.TAG });
    this.health = new Health();
    this.supported = Object.keys(HealthTypes.EthVariants);
  }

  async main() {
    let nodes = await this.discover.getListOfNodes();
    nodes = nodes.filter(({ chain }) => this.supported.includes(chain));
    const response = [];
    for (const { name, chain, ip, port } of nodes) {
      const health = await this.health.getNodeHealth({ chain, ip, port });
      response.push(health);
    }
    return response;
  }
}
