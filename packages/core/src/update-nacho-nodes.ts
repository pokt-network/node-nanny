import { connect, disconnect } from "mongoose";
import { NodesModel } from "./models";

/* ------ Script Function Begins ------ */
(async () => {
  await connect(
    "***REMOVED***",
  );
  /* 5) Create Nodes */

  const hmy01Nodes = await NodesModel.find({ name: { $regex: "HMY/01" } });

  console.log("FOUND HMY 01 NODES!", hmy01Nodes.length);

  for await (const node of hmy01Nodes) {
    const newUrl = node.url.replace("9600", "9500");
    await NodesModel.updateOne({ _id: node.id }, { port: 9500, url: newUrl });
  }

  const hmy02Nodes = await NodesModel.find({ name: { $regex: "HMY/02" } });

  console.log("FOUND HMY 02 NODES!", hmy02Nodes.length);

  for await (const node of hmy02Nodes) {
    const newUrl = node.url.replace("9500", "9600");
    await NodesModel.updateOne({ _id: node.id }, { port: 9600, url: newUrl });
  }

  await disconnect();

  console.log("Fin.");
})();
