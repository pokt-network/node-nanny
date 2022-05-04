import { connect, disconnect } from "mongoose";
import { HostsModel, NodesModel } from "./models";

/* ------ Script Function Begins ------ */
(async () => {
  await connect(
    "mongodb://nacho:8UuA6WJ7QLKw5w@18.195.252.128:27017/nn_nacho?authSource=admin",
  );
  /* 5) Create Nodes */

  const nodes = await NodesModel.find({});

  console.log("FOUND NODES!", nodes.length);

  const nodesWithoutHost = [];
  for await (const node of nodes) {
    if (!(await HostsModel.exists({ _id: node.host }))) {
      nodesWithoutHost.push(node);
    } else {
      // console.log("FOUND HOST");
    }
  }

  console.log(nodesWithoutHost.length, "WITHOUT HOST");

  const hostIds = nodesWithoutHost.reduce(
    (ids, node) =>
      ids.includes(node.host.toString()) ? ids : [...ids, node.host.toString()],
    [],
  );

  console.log(hostIds);
  console.log(hostIds.length);

  await disconnect();

  console.log("Fin.");
})();
