import { ChainsModel } from "./src/models";
import { connect } from "./src/db";
const exe = async () => {
  await connect();
  const res = await ChainsModel.updateMany({ type: "ETH" }, { type: "EVM" });
  console.log(res);
};

exe();
