import AWS from "aws-sdk";
import csv from "csvtojson";
import path from "path";
import { Source, Prefix, Supported } from "./types";
import { Config } from "../../services";
import { ConfigTypes } from "../../types";




const csvNodes = path.resolve(__dirname, "../../../nodes.csv");

class Service {
  private client: AWS.EC2;
  private config: Config;
  private source: Source;
  private sourcePath: string;
  private supported: string[];
  constructor({ source = Source.TAG, sourcePath = csvNodes }) {
    this.config = new Config();
    this.source = source;
    this.sourcePath = sourcePath;
    this.supported = Object.keys(Supported);
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
      throw new Error(`Error, check for issues with tags`);
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
      throw new Error(`could not find external nodes, has ${chain} been on-boarded?`);
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


  /**
   * 
   *      {
            node: {
              name: 'shared-2a/kov',
              chain: 'KOV',
              ip: '10.0.0.79',
              port: '8548'
            },
            peer: {
              name: 'shared-2b/kov',
              chain: 'KOV',
              ip: '10.0.1.208',
              port: '8548'
            },
            external: [
              'https://eth-kovan.alchemyapi.io/v2/AGQmOW_vWum_MNf3efzLBwhn6iRf49Fs'
            ]
          },
   * 
   */
  async getDataNodesfromCsv() {
    const raw = await csv().fromFile(csvNodes);
    const list = ['a', 'b']

    const output = []

    for (const item of raw) {
      let peerItem = list.filter((p) => !(p === item.peer)).join('')
      const peerIndex = raw.findIndex((i) => {
        return i.peer === peerItem && item.chain === i.chain
      })

      const peer = raw[peerIndex]

      output.push({
        node: {
          name: item.name,
          chain: item.chain,
          ip: item.ip,
          port: item.port
        },
        peer: {
          name: peer.name,
          chain: peer.chain,
          ip: peer.ip,
          port: peer.port
        },
        external: item.external.split(';')
      })
    }
    return output;
  }

  async getPocketNodes() {
    const supported = await this.config.getParamsByPrefix(ConfigTypes.ConfigPrefix.POCKET_NODES);
    return supported.map(({ Value }) => {
      let nodes = Value.split(",");
      const [instance] = nodes;
      nodes.shift();

      const nodesWithName = nodes.map((node) => {
        return { url: node, name: node.split("//")[1].split(".")[0] };
      });

      return {
        host: instance,
        nodes: nodesWithName,
      };
    });
  }

  async getNodes(): Promise<any> {
    let dataNodes = await this.getDataNodesFromTags();
    const csvDataNodes = await this.getDataNodesfromCsv()
    const pocketNodes = await this.getPocketNodes();
    dataNodes = dataNodes.concat(csvDataNodes);
    return { dataNodes, pocketNodes };
  }
}

export { Service };
