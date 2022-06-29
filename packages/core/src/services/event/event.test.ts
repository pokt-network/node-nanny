import mongoose from 'mongoose';
import { EErrorConditions, EErrorStatus } from '../health/types';
import { ChainsModel, HostsModel, LocationsModel, NodesModel, INode } from '../../models';
import { Service } from './service';
import { EAlertTypes } from './types';

const eventService = new Service();
let node: INode;

const createMocks = async () => {
  const mockChain = {
    name: 'POKT',
    type: 'POKT',
    allowance: 5,
    chainId: '0666',
    hasOwnEndpoint: true,
    useOracles: false,
    responsePath: 'data.result.healthy',
  };
  const chain = await ChainsModel.create(mockChain);
  const mockLocation = { name: 'USE2' };
  const location = await LocationsModel.create(mockLocation);
  const mockHost = {
    name: 'mainnet1',
    loadBalancer: false,
    location: location.id,
    ip: '12.34.56.0',
  };
  const host = await HostsModel.create(mockHost);
  const mockNode = {
    name: 'mainnet1/POKT/11',
    chain: chain.id,
    host: host.id,
    port: 8810,
    url: `http://${host.ip}:8810`,
    loadBalancers: [host.id],
    backend: 'testpoktmainnet',
    server: '2a',
    automation: true,
  };
  const node = await NodesModel.create(mockNode);
  return { chain, location, host, node };
};
let exampleEventJson: string;

beforeAll(async () => {
  await mongoose.connect(global.__MONGO_URI__);
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('Event Service Tests', () => {
  describe('parseEvent', () => {
    beforeAll(async () => {
      ({ node } = await createMocks());
      exampleEventJson = JSON.stringify({
        name: 'mainnet1/POKT/11',
        status: EErrorStatus.OK,
        conditions: EErrorConditions.HEALTHY,
        health: 'Node is healthy.',
        height: { internalHeight: 63583, externalHeight: 63583, delta: 0 },
        id: node.id.toString(),
      });
    });

    test('Should parse an incoming RESOLVED event', async () => {
      const overAMinuteAgo = new Date(Date.now() - 1000 * 75).toUTCString();
      await NodesModel.updateOne({ _id: node.id }, { erroredAt: overAMinuteAgo });

      jest
        .spyOn(eventService as any, 'getServerCount')
        .mockImplementation(() => ({ online: 1, total: 1 }));

      const {
        node: createdNode,
        title,
        message,
        healthy,
        notSynced,
        status,
        nodesOnline,
        nodesTotal,
        dispatchFrontendDown,
      } = await eventService['parseEvent'](exampleEventJson, EAlertTypes.RESOLVED);
      const nodeAfter = await NodesModel.findOne({ _id: node.id });

      expect(createdNode.name).toEqual('mainnet1/POKT/11');
      expect(title).toEqual('[Resolved] - mainnet1/POKT/11 is HEALTHY.');
      expect(message).toContain('First occurrence of this error was');
      expect(message).toContain('Error occurred for 1 minute, 15 seconds.');
      expect(message).toContain(
        'Block Height - Internal: 63583 / External: 63583 / Delta: 0',
      );
      expect(message).toContain('1 OF 1 NODE IS IN ROTATION FOR TESTPOKTMAINNET.');
      expect(healthy).toEqual(true);
      expect(notSynced).toEqual(false);
      expect(status).toEqual('OK');
      expect(nodesOnline).toEqual(1);
      expect(nodesTotal).toEqual(1);
      expect(dispatchFrontendDown).toEqual(false);
      expect(nodeAfter.erroredAt).toBeFalsy();
    });

    test('Should parse an incoming TRIGGERED event', async () => {
      jest
        .spyOn(eventService as any, 'getServerCount')
        .mockImplementation(() => ({ online: 0, total: 1 }));
      exampleEventJson = JSON.stringify({
        ...JSON.parse(exampleEventJson),
        status: EErrorStatus.ERROR,
        conditions: EErrorConditions.NOT_SYNCHRONIZED,
      });

      const {
        node,
        title,
        message,
        healthy,
        notSynced,
        status,
        nodesOnline,
        nodesTotal,
        dispatchFrontendDown,
      } = await eventService['parseEvent'](exampleEventJson, EAlertTypes.TRIGGER);

      expect(node.name).toEqual('mainnet1/POKT/11');
      expect(node.erroredAt).toBeTruthy();
      expect(title).toEqual('[Triggered] - mainnet1/POKT/11 is NOT_SYNCHRONIZED.');

      expect(message).toContain('First occurrence of this error was');
      expect(message).toContain('Error has been occurring for');
      expect(message).toContain(
        'Block Height - Internal: 63583 / External: 63583 / Delta: 0',
      );
      expect(message).toContain('0 OF 1 NODE IS IN ROTATION FOR TESTPOKTMAINNET.');
      expect(healthy).toEqual(false);
      expect(notSynced).toEqual(true);
      expect(status).toEqual('ERROR');
      expect(nodesOnline).toEqual(0);
      expect(nodesTotal).toEqual(1);
      expect(dispatchFrontendDown).toEqual(false);
    });
  });
});
