import { connect, disconnect } from "mongoose";
import { NodesModel } from "./models";

const getNodeName = async (hostName: string, chainName: string): Promise<string> => {
  const name = `${hostName}/${chainName}`;
  const count = String((await NodesModel.count({ name: { $regex: name } })) + 1).padStart(
    2,
    "0",
  );
  return `${name}/${count}`;
};

/* ------ Script Function Begins ------ */
(async () => {
  await connect(process.env.MONGO_URI);
  let nodesUpdated = 0;

  const nodes = await NodesModel.find()
    .populate("chain")
    .populate({ path: "host", populate: "location" })
    .populate("loadBalancers")
    .exec();

  for await (const node of nodes) {
    const name = await getNodeName(node.host.name, node.chain.name);
    await NodesModel.updateOne({ _id: node.id }, { name });
    console.log({ name });
    nodesUpdated++;
    console.log(`Updated ${nodesUpdated} of ${nodes.length} nodes...`);
  }

  console.log(`Updated ${nodesUpdated} of ${nodes.length} nodes...`);

  await disconnect();

  console.log("Fin.");
})();
