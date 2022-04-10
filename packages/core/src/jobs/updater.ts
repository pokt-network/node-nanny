import axios from "axios";
import { connect, disconnect } from "../db";
import { ChainsModel, OraclesModel, IChain, IOracle, WebhookModel } from "../models";
import { getTimestamp } from "../utils";

interface IChainsAndOraclesResponse {
  chains: IChain[];
  oracles: IOracle[];
}

/* ----- Script Runs Every Hour ----- */
(async () => {
  if (process.env.PNF === "1") return;

  await connect();

  /* ---- 1) Get newest local Chain and Oracle records' timestamps ---- */
  const [{ createdAt: latestChain }] = await ChainsModel.find()
    .sort({ createdAt: -1 })
    .limit(1)
    .select("createdAt")
    .exec();
  const [{ createdAt: latestOracle }] = await OraclesModel.find()
    .sort({ createdAt: -1 })
    .limit(1)
    .select("createdAt")
    .exec();

  /* ---- 2) Fetch any newer remote Chain and Oracle records from Infrastructure Support Lambda ---- */
  const {
    data: { chains, oracles },
  } = await axios.post<IChainsAndOraclesResponse>(
    "https://k69ggmt3u3.execute-api.us-east-2.amazonaws.com/update",
    { latestChain, latestOracle },
  );

  if (chains?.length || oracles?.length) {
    console.log(
      `Running updater at ${getTimestamp()}.\nFound ${chains.length} newer chains and ${
        oracles.length
      } newer oracles ...`,
    );

    /* ---- 3) Add newer Chains and Oracles to local database ---- */
    if (chains?.length) {
      for await (const chain of chains) {
        const { name } = chain;

        try {
          if (!(await ChainsModel.exists({ name }))) {
            const chainInput = {
              type: chain.type,
              name: chain.name,
              allowance: chain.allowance,
            };
            await ChainsModel.create(chainInput);
          }
        } catch (error) {
          console.error(`Error updating Chains. Chain: ${name} ${error}`);
          continue;
        }
      }
    }

    if (oracles?.length) {
      for await (const oracle of oracles) {
        const { chain } = oracle;

        try {
          if (!(await OraclesModel.exists({ chain }))) {
            await OraclesModel.create(oracle);
          }
        } catch (error) {
          console.error(`Error updating Oracles. Chain: ${chain} ${error}`);
          continue;
        }
      }
    }
  }

  await disconnect();
})();
