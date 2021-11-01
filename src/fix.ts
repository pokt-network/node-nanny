import { connect } from "./db";
import { INode, NodesModel, IOracle, OraclesModel } from "./models";
import { Service } from "../src/services/datadog";

const dd = new Service();

const fix = async () => {
  await connect();

  // const res = await NodesModel.updateMany({},{hasPeer: true, $unset: {hasPeers: ""}}).exec()
  // console.log(res)

  const all = await NodesModel.find({ server: null, "chain.type": { $ne: "POKT" } }).exec();

  console.log(all)

  // for (const { _id, hostname, port, container, host } of all) {
  //   if (host.name.includes("-")) {
  //     const res = await NodesModel.updateOne(
  //       { _id },
  //       { $set: { server: host.name.split("-").splice(-1).join("") } },
  //     ).exec();
  //   }
  // }

  return;
};

fix();
