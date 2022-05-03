import axios from "axios";

import { connect, disconnect } from "../db";
import { ChainsModel, OraclesModel, IChain, IOracle } from "../models";
import { getTimestamp } from "../utils";

import env from "../environment";

interface IChainsAndOraclesResponse {
  chains: IChain[];
  oracles: IOracle[];
}

/* ----- Script Runs Every Hour ----- */
(async () => {
  if (env("PNF")) return;

  await connect();

  /* ----- 1) Get newest local Chain and Oracle records' timestamps ---- */
  const nodeNannysBirthday = new Date("2022-02-14").toISOString();

  const [{ updatedAt: latestChain }] = (await ChainsModel.exists({}))
    ? await ChainsModel.find().sort({ updatedAt: -1 }).limit(1).select("updatedAt").exec()
    : [{ updatedAt: nodeNannysBirthday }];

  const [{ updatedAt: latestOracle }] = (await OraclesModel.exists({}))
    ? await OraclesModel.find()
        .sort({ updatedAt: -1 })
        .limit(1)
        .select("updatedAt")
        .exec()
    : [{ updatedAt: nodeNannysBirthday }];

  /* ----- 2) Fetch any newer remote Chain and Oracle records from Infrastructure Support Lambda ---- */
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

    /* ----- 3) Add newer Chains and Oracles to local database ---- */
    if (chains?.length) {
      for await (const chain of chains) {
        const { name, type, allowance } = chain;

        try {
          if (await ChainsModel.exists({ name })) {
            await ChainsModel.updateOne({ name }, { name, type, allowance });
          } else {
            await ChainsModel.create({ name, type, allowance });
          }
        } catch (error) {
          console.error(`Error updating Chains. Chain: ${name} ${error}`);
          continue;
        }
      }
    }

    if (oracles?.length) {
      for await (const oracle of oracles) {
        const { chain, urls } = oracle;

        try {
          if (await OraclesModel.exists({ chain })) {
            await OraclesModel.updateOne({ chain }, { chain, urls });
          } else {
            await OraclesModel.create({ chain, urls });
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
