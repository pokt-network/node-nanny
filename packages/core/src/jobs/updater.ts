import axios from "axios";
import { connect, disconnect } from "../db";
import { ChainsModel, OraclesModel, IChain, IOracle } from "../models";
import { getTimestamp } from "../utils";

interface IChainsAndOraclesResponse {
  chains: IChain[];
  oracles: IOracle[];
}

(async () => {
  await connect();

  const {
    data: { chains, oracles },
  } = await axios.get<IChainsAndOraclesResponse>(
    "https://h459tvbr1d.execute-api.us-east-2.amazonaws.com/update",
  );

  console.log(
    `Running updater at ${getTimestamp()}.\nChecking ${chains.length} chains and ${
      oracles.length
    } oracles ...`,
  );

  const existingChains = (await ChainsModel.find()).map(({ name }) => name);

  for await (const chain of chains) {
    const { name } = chain;

    try {
      if (!existingChains.includes(name)) {
        await ChainsModel.create(chain);
      }
    } catch (error) {
      console.error(`Error updating Chains. Chain: ${name} ${error}`);
      continue;
    }
  }

  const existingOracles = (await OraclesModel.find()).map(({ chain }) => chain);

  for await (const oracle of oracles) {
    const { chain } = oracle;

    try {
      if (!existingOracles.includes(chain)) {
        await OraclesModel.create(oracle);
      }
    } catch (error) {
      console.error(`Error updating Oracles. Chain: ${chain} ${error}`);
      continue;
    }
  }

  await disconnect();
})();
