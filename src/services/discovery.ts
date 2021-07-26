import AWS from "aws-sdk";
import csv from "csvtojson";
import path from "path";

//todo cast https to bool
interface Nodes {
  name: string;
  type: string;
  ip: string;
  port: string;
  https: string;
}

enum Source {
  CSV = "csv",
  TAG = "tag",
}

enum Prefix {
  BLOCKCHAIN = "blockchain",
  NAME = "Name",
}
const csvNodes = path.resolve(__dirname, "../../nodes.csv");

class Service {
  private source: Source;
  private sourcePath: string;
  private client: AWS.EC2;
  constructor({ source = Source.TAG, sourcePath = csvNodes }) {
    this.source = source;
    this.sourcePath = sourcePath;
  }

  initEC2() {
    this.client = new AWS.EC2({ region: "us-east-2" });
  }

  getInstanceName(tags) {
    const [{ Value }] = tags.filter(({ Key }) => Key === Prefix.NAME);
    return Value;
  }
  async getNodesListFromTags() {
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
        if (Key.includes(Prefix.BLOCKCHAIN)) {
          const [, type] = Key.split("-");
          const name = `${instanceName}/${type.toLowerCase()}`;
          const port = Value;
          nodes.push({ name, type, ip, port, https: "false" });
        }
      }
    }
    return nodes;
  }

  async getListOfNodes(): Promise<any> {
    if (this.source === Source.TAG) {
      return await this.getNodesListFromTags();
    }
    if (this.source === Source.CSV) {
      return await csv().fromFile(this.sourcePath);
    }
  }
}

export { Service };
