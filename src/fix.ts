import { connect } from "./db";
import { INode, NodesModel, IOracle, OraclesModel } from "./models";
import { Service } from "../src/services/datadog";

const dd = new Service();

const fix = async () => {
  await connect();

  return;
};

fix();
