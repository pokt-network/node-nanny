import { connect } from "./db";
import { INode, NodesModel, IOracle, OraclesModel } from "./models";
import { Retool, DataDog } from "./services";
const dd = new DataDog();
const retool = new Retool();

const fix = async () => {
  await connect();
  const res = await NodesModel.updateMany({ "chain.type": "POKT" }, { $set: { variance: 3 } });
  console.log(res);
  return;
};

fix();
