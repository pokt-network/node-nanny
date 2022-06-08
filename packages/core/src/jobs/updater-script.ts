import axios from 'axios';
import { FilterQuery } from 'mongoose';

import { ChainsModel, OraclesModel, NodesModel, IChain, IOracle } from '../models';
import { getTimestamp } from '../utils';

interface IChainsAndOraclesResponse {
  chains: IChain[];
  oracles: IOracle[];
}

interface ICurrentChainsAndOraclesResponse {
  currentChains: string[];
}

/* ----- Script Runs Every 30 minutes ----- */
export const updaterScript = async () => {
  const nodeNannysBirthday = new Date('2022-02-14').toISOString();

  /* ----- 1) Get newest local Chain and Oracle records' timestamps ---- */
  console.log('Initiating ⛓️ Chains & 🔮 Oracles updater ...');
  let latestChain: string, latestOracle: string;

  if (await ChainsModel.exists({})) {
    const [{ updatedAt }] = await ChainsModel.find({})
      .sort({ updatedAt: -1 })
      .limit(1)
      .select('updatedAt')
      .exec();
    latestChain = new Date(updatedAt).toISOString();
    console.log(`⛓️\ Latest chain update is ${latestChain} ...`);
  } else {
    latestChain = nodeNannysBirthday;
    console.log(`⛓️\ No chains found ...`);
  }

  if (await OraclesModel.exists({})) {
    const [{ updatedAt }] = await OraclesModel.find({})
      .sort({ updatedAt: -1 })
      .limit(1)
      .select('updatedAt')
      .exec();
    latestOracle = new Date(updatedAt).toISOString();
    console.log(`🔮 Latest oracle update is ${latestOracle} ...`);
  } else {
    latestOracle = nodeNannysBirthday;
    console.log(`🔮 No oracles found ...`);
  }

  /* ----- 2) Fetch any newer remote Chain and Oracle records from Infrastructure Support Lambda ---- */
  console.log(
    `Fetching with latest chain ${latestChain} & latest oracle ${latestOracle} ...`,
  );
  const {
    data: { chains, oracles },
  } = await axios.post<IChainsAndOraclesResponse>(
    'https://k69ggmt3u3.execute-api.us-east-2.amazonaws.com/update',
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
        const {
          name,
          type,
          allowance,
          chainId,
          hasOwnEndpoint,
          useOracles,
          responsePath,
          rpc,
          endpoint,
          healthyValue,
        } = chain;

        const sanitizedChain: FilterQuery<IChain> = {};
        Object.entries({
          name,
          type,
          allowance,
          chainId,
          hasOwnEndpoint,
          useOracles,
          responsePath,
          rpc,
          endpoint,
          healthyValue,
        }).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            sanitizedChain[key] = value;
          }
        });

        try {
          if (await ChainsModel.exists({ name })) {
            await ChainsModel.updateOne({ name }, sanitizedChain);
          } else {
            await ChainsModel.create(sanitizedChain);
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
            await OraclesModel.updateOne({ chain }, { urls });
          } else {
            await OraclesModel.create({ chain, urls });
          }
        } catch (error) {
          console.error(`Error updating Oracles. Chain: ${chain} ${error}`);
          continue;
        }
      }
    }
  } else {
    console.log('No new chains or oracles found ...');
  }

  /* ----- 4) Remove Chains and Oracles that no longer exist in prod from local database ---- */
  console.log('Checking all current chains and oracles ...');
  const {
    data: { currentChains },
  } = await axios.get<ICurrentChainsAndOraclesResponse>(
    'https://k69ggmt3u3.execute-api.us-east-2.amazonaws.com/get-current',
  );

  const chainsNotInProd = await ChainsModel.find({ name: { $nin: currentChains } });

  if (chainsNotInProd?.length) {
    for await (const { _id, name } of chainsNotInProd) {
      const chainHasNode = await NodesModel.exists({ chain: _id });

      if (!chainHasNode) {
        await ChainsModel.deleteOne({ name });

        if (await OraclesModel.exists({ chain: name })) {
          await OraclesModel.deleteOne({ chain: name });
        }
      }
    }
  }
};
