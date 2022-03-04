import { Types } from "mongoose";
import { connect, disconnect } from "./db";
import { NodesModel } from "./models";

(async () => {
  await connect();

  // const locations = ["NL", "LI", "DE", "USE1", "USE2", "USW2", "HK", "LDN", "SG"];

  // for await (const location of locations) {
  //   await LocationsModel.create({ name: location });
  // }

  const nodes = await NodesModel.find({}).populate("host").exec();
  console.log("FOUND", nodes.length, "NODEs");
  // console.log(nodes.filter(({ host }) => !host).map(({ _id }) => _id));

  // for await (const node of nodes) {
  //   // const hostLocation = node.host.internalHostName?.split(".")[1];
  //   // const hostLocationCode = {
  //   //   "us-east-2": "USE2",
  //   //   "ap-southeast-1": "APSE1",
  //   //   "us-west-2": "USW2",
  //   // }[hostLocation];
  //   // if (hostLocationCode) {
  //   //   const [{ _id }] = await LocationsModel.find({ name: hostLocationCode as any });
  //   //   // console.log({ hostLocation, hostLocationCode, location });

  //   if (!node.host) {
  //     // console.log("NO HOST FOUND FOR", node);
  //     const DELETED = await NodesModel.deleteOne({ _id: node.id });
  //     console.log({ DELETED });
  //   }

  //   // }
  // }

  await disconnect();
})();
