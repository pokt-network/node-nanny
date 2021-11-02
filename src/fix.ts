import { connect } from "./db";
import { INode, NodesModel, IOracle, OraclesModel } from "./models";
import { Service } from "../src/services/datadog";

const dd = new Service();

const fix = async () => {
  await connect();

  const nodes = await NodesModel.updateMany({hasPeer: null}, {$set: {hasPeer: true}});
  console.log(`Updated ${nodes} nodes`);

  return;
};

fix();
