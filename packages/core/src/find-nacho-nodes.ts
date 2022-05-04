import { connect, disconnect } from "mongoose";
import { HostsModel, NodesModel } from "./models";

/* ------ Script Function Begins ------ */
(async () => {
  await connect(
    "***REMOVED***",
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
