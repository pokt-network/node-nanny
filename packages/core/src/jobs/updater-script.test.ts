import mongoose from 'mongoose';
import { ChainsModel, NodesModel, OraclesModel } from '../models';
import { updaterScript } from './updater-script';

beforeAll(async () => {
  await mongoose.connect(global.__MONGO_URI__);
});

afterAll(async () => {
  await ChainsModel.deleteMany({});
  await OraclesModel.deleteMany({});
  await mongoose.disconnect();
});

const chainRequiredFields = [
  'id',
  'name',
  'type',
  'chainId',
  'allowance',
  'hasOwnEndpoint',
  'useOracles',
  'responsePath',
];
const oracleFields = ['chain', 'urls'];

const deprecatedChain = {
  name: 'NOTREAL',
  type: 'NOTREAL',
  allowance: 123,
  chainId: '666',
  hasOwnEndpoint: false,
  useOracles: true,
  responsePath: 'test',
  rpc: '{}',
  endpoint: '/test',
  healthyValue: 'ok',
};
const deprecatedOracle = { chain: 'NOTREAL', urls: ['http://www.notreal.com'] };

describe('Updater script tests ', () => {
  beforeEach(async () => {
    await ChainsModel.deleteMany({});
    await OraclesModel.deleteMany({});
  });

  test('Should create all chains and oracles if none exist in DB', async () => {
    const chainsBefore = await ChainsModel.find({});
    const oraclesBefore = await OraclesModel.find({});

    /* Run Updater Script */
    await updaterScript();

    const chainsAfter = await ChainsModel.find({});
    const oraclesAfter = await OraclesModel.find({});

    expect(chainsBefore.length).toEqual(0);
    expect(oraclesBefore.length).toEqual(0);
    expect(chainsAfter.length).toBeGreaterThan(chainsBefore.length);
    expect(oraclesAfter.length).toBeGreaterThan(oraclesBefore.length);
    chainsAfter.forEach((chain) => {
      chainRequiredFields.forEach((field) => {
        expect(chain).toHaveProperty(field);
      });
    });
    oraclesAfter.forEach((oracle) => {
      oracleFields.forEach((field) => {
        expect(oracle).toHaveProperty(field);
      });
    });
  });

  test("Should delete any chains and their oracles that don't exist in the prod DB and they don't have any nodes", async () => {
    await ChainsModel.create(deprecatedChain);
    await OraclesModel.create(deprecatedOracle);
    const chainsBefore = await ChainsModel.find({});
    const oraclesBefore = await OraclesModel.find({});

    const deprecatedChainExistsBefore = !!(await ChainsModel.exists({
      name: deprecatedChain.name,
    }));
    const deprecatedOracleExistsBefore = !!(await OraclesModel.exists({
      chain: deprecatedOracle.chain,
    }));

    /* Run Updater Script */
    await updaterScript();

    const chainsAfter = await ChainsModel.find({});
    const oraclesAfter = await OraclesModel.find({});

    const deprecatedChainExistsAfter = !!(await ChainsModel.exists({
      name: deprecatedChain.name,
    }));
    const deprecatedOracleExistsAfter = !!(await OraclesModel.exists({
      chain: deprecatedOracle.chain,
    }));

    expect(chainsBefore.length).toEqual(1);
    expect(oraclesBefore.length).toEqual(1);
    expect(chainsAfter.length).toEqual(0);
    expect(oraclesAfter.length).toEqual(0);

    expect(deprecatedChainExistsBefore).toEqual(true);
    expect(deprecatedOracleExistsBefore).toEqual(true);
    expect(deprecatedChainExistsAfter).toEqual(false);
    expect(deprecatedOracleExistsAfter).toEqual(false);
  });

  test('Should not delete any chains if they have 1 or more node(s)', async () => {
    await ChainsModel.create(deprecatedChain);
    await OraclesModel.create(deprecatedOracle);
    const chainsBefore = await ChainsModel.find({});
    const oraclesBefore = await OraclesModel.find({});

    const { _id } = await ChainsModel.findOne({ name: deprecatedChain.name });
    await NodesModel.create({
      chain: _id,
      host: '6269d628d6667341d142012b',
      name: 'test_node',
      port: 1234,
      url: 'http://www.test.com',
    });

    const deprecatedChainExistsBefore = !!(await ChainsModel.exists({
      name: deprecatedChain.name,
    }));
    const deprecatedOracleExistsBefore = !!(await OraclesModel.exists({
      chain: deprecatedOracle.chain,
    }));

    /* Run Updater Script */
    await updaterScript();

    const chainsAfter = await ChainsModel.find({});
    const oraclesAfter = await OraclesModel.find({});

    const deprecatedChainExistsAfter = !!(await ChainsModel.exists({
      name: deprecatedChain.name,
    }));
    const deprecatedOracleExistsAfter = !!(await OraclesModel.exists({
      chain: deprecatedOracle.chain,
    }));

    expect(chainsBefore.length).toEqual(1);
    expect(oraclesBefore.length).toEqual(1);
    expect(chainsAfter.length).toEqual(1);
    expect(oraclesAfter.length).toEqual(1);

    expect(deprecatedChainExistsBefore).toEqual(true);
    expect(deprecatedOracleExistsBefore).toEqual(true);
    expect(deprecatedChainExistsAfter).toEqual(true);
    expect(deprecatedOracleExistsAfter).toEqual(true);
  });
});
