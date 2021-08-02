import AWS from "aws-sdk";
import csv from "csvtojson";
import path from "path";
import { Source, Prefix, Supported } from "./types";
import { Config } from "../../services";
import { Alert } from "../../services";
import { ConfigTypes } from "../../types";

const csvNodes = path.resolve(__dirname, "../../nodes.csv");

class Service {
  private alert: Alert;
  private client: AWS.EC2;
  private config: Config;
  private source: Source;
  private sourcePath: string;
  private supported: string[];
  private pocketHosts: string[];
  constructor({ source = Source.TAG, sourcePath = csvNodes }) {
    this.alert = new Alert();
    this.config = new Config();
    this.source = source;
    this.sourcePath = sourcePath;
    this.supported = Object.keys(Supported);
    this.pocketHosts = Object.values(ConfigTypes.PocketHosts);
  }

  private initEC2() {
    this.client = new AWS.EC2({ region: "us-east-2" });
  }

  private getInstanceName(tags) {
    const [{ Value }] = tags.filter(({ Key }) => Key === Prefix.NAME);
    return Value;
  }
  async getNodesFromEC2() {
    try {
      const nodes = [];
      this.initEC2();
      const { Reservations } = await this.client
        .describeInstances({
          Filters: [
            {
              Name: "tag:Type",
              Values: ["node-host"],
            },
          ],
        })
        .promise();

      for (const { Instances } of Reservations) {
        const [{ PrivateIpAddress: ip, Tags }] = Instances;
        const instanceName = this.getInstanceName(Tags);
        for (const { Key, Value } of Tags) {
          if (Key.includes(Prefix.BLOCKCHAIN) && Key.includes("-")) {
            const [, chain] = Key.split("-");
            const name = `${instanceName}/${chain.toLowerCase()}`;
            const port = Value;
            nodes.push({ name, chain, ip, port });
          }
        }
      }
      return nodes.filter(({ chain }) => this.supported.includes(chain));
    } catch (error) {
      this.alert.sendErrorAlert(`Error, check for issues with tags`);
    }
  }

  findPeerNode({ current, all }) {
    const { chain, ip } = current;
    for (const node of all) {
      if (node.chain === chain && node.ip !== ip) {
        return node;
      }
    }
    return {};
  }

  async findExternalNode(chain) {
    try {
      const { Value } = await this.config.getParamByKey(
        `${ConfigTypes.ConfigPrefix.EXTERNAL_ENDPOINT}/${chain.toLowerCase()}`,
      );
      return Value.split(",");
    } catch (error) {
      this.alert.sendErrorAlert(`could not find external nodes, has ${chain} been onboarded?`);
    }
  }

  async getDataNodesFromTags() {
    let nodes = await this.getNodesFromEC2();
    nodes = nodes.map(async (node) => {
      return {
        node,
        peer: this.findPeerNode({ current: node, all: nodes }),
        external: await this.findExternalNode(node.chain),
      };
    });

    return Promise.all(nodes);
  }

  async getPocketPeers({ current }) {
    let other;

    for (const host of this.pocketHosts) {
      if (current !== host) {
        other = host;
      }
    }

    const { Value } = await this.config.getParamByKey(
      `${ConfigTypes.ConfigPrefix.POCKET_NODES}/${other}`,
    );
    let nodes = Value.split(",");
    nodes.shift();

    return nodes;
  }
  async getPocketNodes() {
    const output = [];

    for (const host of this.pocketHosts) {
      const { Value } = await this.config.getParamByKey(
        `${ConfigTypes.ConfigPrefix.POCKET_NODES}/${host}`,
      );

      let nodes = Value.split(",");

      const [instance] = nodes;

      nodes.shift();

      for (const url of nodes) {
        output.push({
          host: instance,
          url,
          peer: await this.getPocketPeers({ current: host }),
        });
      }
    }

    return output;
  }

  async getNodes(): Promise<any> {
    if (this.source === Source.TAG) {
      const dataNodes = await this.getDataNodesFromTags();
      const pocketNodes = await this.getPocketNodes();
      return { dataNodes, pocketNodes };
    }
    if (this.source === Source.CSV) {
      return await csv().fromFile(this.sourcePath);
    }
  }
}

export { Service };
