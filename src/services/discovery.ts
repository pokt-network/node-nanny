import path from "path";
import csv from "csvtojson";

//todo cast https to bool
interface Nodes {
  name: string;
  type: string;
  ip: string;
  port: string;
  https: string;
}

const sourcePath = path.resolve(__dirname, "../../nodes.csv");

class Service {
  async getListOfNodes(): Promise<Nodes[]> {
    return await csv().fromFile(sourcePath);
  }
}

export { Service };
