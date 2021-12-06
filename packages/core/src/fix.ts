import { ChainsModel, NodesModel } from "./models";
import { Health } from "./services";
import { connect } from "./db";
const health = new Health();
const exe = async () => {
  await connect();
  const nodes = await NodesModel.find({}).populate("host").populate("chain").exec();

  for (const node of nodes) {
    const reading = await health.getNodeHealth(node);

    console.log(reading);
  }
};

exe();
//error http://195.189.97.31:18545
