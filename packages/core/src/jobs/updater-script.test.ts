import mongoose from 'mongoose';
import { ChainsModel, OraclesModel } from '../models';
import { updaterScript } from './updater-script';

beforeAll(async () => {
  await mongoose.connect(global.__MONGO_URI__);
  await ChainsModel.deleteMany({});
  await OraclesModel.deleteMany({});
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
  // 'updatedAt',
];
const chainOptionalFields = ['rpc', 'endpoint', 'healthyValue'];
const oracleFields = ['chain', 'urls'];

const deprecatedChain = {
  name: 'NOTAREALCHAIN',
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
  test('Should create all chains and oracles if none exist in DB', async () => {
    const chainsBefore = await ChainsModel.find({});
    const oraclesBefore = await OraclesModel.find({});

    await ChainsModel.create(deprecatedChain);
    await OraclesModel.create(deprecatedOracle);
    const deprecatedChainExistsBefore = await ChainsModel.exists({
      name: deprecatedChain.name,
    });
    const deprecatedOracleExistsBefore = await OraclesModel.exists({
      chain: deprecatedOracle.chain,
    });

    /* Run Updater Script */
    await updaterScript();

    const chainsAfter = await ChainsModel.find({});
    const oraclesAfter = await OraclesModel.find({});

    const deprecatedChainExistsAfter = await ChainsModel.exists({
      name: deprecatedChain.name,
    });
    const deprecatedOracleExistsAfter = await OraclesModel.exists({
      chain: deprecatedOracle.chain,
    });

    expect(chainsBefore.length).toEqual(1);
    expect(oraclesBefore.length).toEqual(1);
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

    expect(deprecatedChainExistsBefore).toEqual(true);
    expect(deprecatedOracleExistsBefore).toEqual(true);
    expect(deprecatedChainExistsAfter).toEqual(false);
    expect(deprecatedOracleExistsAfter).toEqual(false);
  });
});
