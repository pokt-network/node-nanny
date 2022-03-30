import { connect, disconnect, Schema, model, Model } from "mongoose";
import { ChainsModel } from "./models";

interface IChainProd {
  chain: string;
  name: string;
  type: string;
  variance: number;
}

const chainSchemaProd = new Schema<IChainProd>({
  chain: String,
  name: String,
  type: String,
  variance: Number,
});

const ChainsModelProd: Model<IChainProd> = model("chains", chainSchemaProd);

/* ------ Script Function Begins ------ */
(async () => {
  /* ------ Connect to Production Inventory DB ------*/
  await connect(process.env.PROD_MONGO_URI);

  const chainsProd = await ChainsModelProd.find({});

  await disconnect();

  /* ------ Connect to New Inventory DB ------ */
  await connect(process.env.MONGO_URI);

  /* 1) Create Chains */
  for await (let chain of chainsProd) {
    const chainInput = {
      type: chain.type,
      name: chain.name,
      allowance: chain.variance,
    };

    await ChainsModel.create(chainInput);
    break;
  }

  await disconnect();

  console.log("Fin.");
})();
