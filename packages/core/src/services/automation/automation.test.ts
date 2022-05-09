import mongoose from 'mongoose';
import {
  NodesModel,
  ChainsModel,
  HostsModel,
  LocationsModel,
  IChain,
  ILocation,
  IHost,
  INode,
} from '../../models';
import { Service } from './service';

const automationService = new Service();
let chain: IChain, location: ILocation, host: IHost, node: INode;

const createMocks = async () => {
  const mockChain = { name: 'TST', type: 'TST', allowance: 5 };
  const chain = await ChainsModel.create(mockChain);
  const mockLocation = { name: 'USE2' };
  const location = await LocationsModel.create(mockLocation);
  const mockHost = {
    name: 'test/testypoo-2a',
    loadBalancer: false,
    location: location.id,
    ip: '12.34.56.0',
  };
  const host = await HostsModel.create(mockHost);
  const mockNode = {
    chain: chain.id,
    host: host.id,
    port: 8810,
    url: `http://${host.ip}:8810`,
    loadBalancers: [host.id],
    backend: 'testtestmainnet',
    server: '2a',
    automation: true,
  };
  const node = await NodesModel.create(mockNode);
  return { chain, location, host, node };
};

beforeAll(async () => {
  await mongoose.connect(global.__MONGO_URI__);
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('Automation Service Tests', () => {
  describe('Node Tests', () => {
    beforeAll(async () => {
      ({ chain, location, host, node } = await createMocks());
    });

    describe('Update Node Tests', () => {
      test('Should update one single node', async () => {
        const update = {
          id: node.id.toString(),
          server: '2c',
          port: 5678,
          backend: null,
        };

        const updatedNode = await automationService.updateNode(update, false);

        expect(updatedNode.server).toEqual(update.server);
        expect(updatedNode.port).toEqual(update.port);
        expect(updatedNode.url).toEqual(
          node.url.replace(String(node.port), String(update.port)),
        );
        expect(updatedNode.backend).toEqual(null);
      });

      test("Should update node's protocol when https arg passed to update method", async () => {
        const update = { id: node.id.toString(), https: true };

        const updatedNode = await automationService.updateNode(update, false);
        const newProtocol = updatedNode.url.split('://')[0];

        expect(newProtocol).toEqual('https');
      });
    });

    describe('Delete Node Tests', () => {
      test('Should delete one single node', async () => {
        const nodeExists = !!(await NodesModel.exists({ _id: node.id }));
        await automationService.deleteNode(node.id.toString(), false);
        const nodeDeleted = !(await NodesModel.exists({ _id: node.id }));

        expect(nodeExists).toEqual(true);
        expect(nodeDeleted).toEqual(true);
      });
    });

    afterAll(async () => {
      await ChainsModel.deleteMany({});
      await LocationsModel.deleteMany({});
      await HostsModel.deleteMany({});
      await NodesModel.deleteMany({});
    });
  });

  describe('Host Tests', () => {
    beforeAll(async () => {
      ({ chain, location, host, node } = await createMocks());
    });

    describe('Update Host Tests', () => {
      test('Should update one single host', async () => {
        const update = {
          id: host.id.toString(),
          name: 'test/testicule-2c',
          loadBalancer: true,
          ip: '86.75.30.9',
        };

        const updatedHost = await automationService.updateHost(update, false);

        expect(updatedHost.name).toEqual(update.name);
        expect(updatedHost.loadBalancer).toEqual(update.loadBalancer);
        expect(updatedHost.ip).toEqual(update.ip);
      });

      test("Should update a node's URL if the host's domain changes", async () => {
        const update = {
          id: host.id.toString(),
          name: 'test/testicule-2c',
          loadBalancer: true,
          ip: '102.3.67.2',
        };

        const nodeBeforeUpdate = node;
        const updatedHost = await automationService.updateHost(update, false);
        const nodeAfterUpdate = await NodesModel.findOne({ _id: nodeBeforeUpdate.id });

        const expectedNodeUrl = nodeBeforeUpdate.url.replace(
          nodeBeforeUpdate.url.split('://')[1].split(':')[0],
          update.ip,
        );

        expect(updatedHost.name).toEqual(update.name);
        expect(updatedHost.loadBalancer).toEqual(update.loadBalancer);
        expect(updatedHost.ip).toEqual(update.ip);
        expect(nodeAfterUpdate.url).toEqual(expectedNodeUrl);
      });

      test("Should unset host's ip field when host changed from ip to fqdn", async () => {
        const update = {
          id: host.id.toString(),
          fqdn: 'testingplace.test.com',
        };

        const updatedHost = await automationService.updateHost(update, false);

        expect(host.ip).toBeTruthy();
        expect(updatedHost.fqdn).toEqual(update.fqdn);
        expect(updatedHost.ip).toEqual(undefined);
      });

      test("Should update node's protocol and unset host's fqdn field when host changed from fqdn to ip", async () => {
        const reset = { id: host.id.toString(), fqdn: 'reset.test.com' };
        const resetHost = await automationService.updateHost(reset, false);

        const update = { id: host.id.toString(), ip: '123.6.3.12' };

        const nodeBeforeUpdate = await automationService.updateNode(
          { id: node.id.toString(), https: true },
          false,
        );
        const updatedHost = await automationService.updateHost(update, false);
        const nodeAfterUpdate = await NodesModel.findOne({ _id: nodeBeforeUpdate.id });

        const protocolBeforeUpdate = nodeBeforeUpdate.url.split('://')[0];
        const protocolAfterUpdate = nodeAfterUpdate.url.split('://')[0];

        expect(resetHost.fqdn).toBeTruthy();
        expect(updatedHost.ip).toEqual(update.ip);
        expect(updatedHost.fqdn).toEqual(undefined);
        expect(protocolBeforeUpdate).toEqual('https');
        expect(protocolAfterUpdate).toEqual('http');
      });
    });

    describe('Delete Host Tests', () => {
      test('Should delete one single host', async () => {
        const hostExists = !!(await HostsModel.exists({ _id: host.id }));
        await automationService.deleteHost(host.id.toString(), false);
        const hostDeleted = !(await HostsModel.exists({ _id: node.id }));

        expect(hostExists).toEqual(true);
        expect(hostDeleted).toEqual(true);
      });
    });

    afterAll(async () => {
      await ChainsModel.deleteMany({});
      await LocationsModel.deleteMany({});
      await HostsModel.deleteMany({});
      await NodesModel.deleteMany({});
    });
  });
});
