import { connect, disconnect } from "mongoose";
import { NodesModel } from "./models";

/* ------ Script Function Begins ------ */
(async () => {
  await connect(process.env.MONGO_URI);
  let nodesUpdated = 0;

  const nodes = await NodesModel.find({ dispatch: true }).exec();

  for await (const node of nodes) {
    const server = node.name.split("/")[1];
    const backend = "poktdispatch";
    await NodesModel.updateOne({ _id: node.id }, { server, backend });
    nodesUpdated++;
    console.log(`Updated ${nodesUpdated} of ${nodes.length} nodes...`);
  }

  console.log(`Updated ${nodesUpdated} of ${nodes.length} nodes...`);

  await disconnect();

  console.log("Fin.");
})();
