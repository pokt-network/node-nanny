import axios, { AxiosResponse } from 'axios';
import child_process from 'child_process';

import { Service } from './service';
import { IHealthCheckParams, EErrorConditions, EErrorStatus } from './types';
import { IChain, INode, NodesModel, OraclesModel } from '../../models';
import { hexToDec } from '../../utils';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create.mockImplementation((_config) => axios);

jest.mock('child_process');
// const mockedChildProcess = child_process as jest.Mocked<typeof child_process>;

const healthService = new Service();

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

describe('Health Service Tests', () => {
  describe('Chain-agnostic Health Check Tests', () => {
    const mockNodeParams: IHealthCheckParams = {
      node: {
        id: '62420628d8696941d1c42039',
        name: 'TEST-HOST/TST/01',
        chain: { path: '/health' },
        host: { ip: '162.210.199.42' },
        url: 'http://162.210.199.42:8545',
        port: 8545,
        basicAuth: null,
      } as unknown as INode,
      oracles: ['https://whatever1.com', 'https://whatever2.com'],
      peers: ['https://whatever1.com', 'https://whatever2.com'],
    };

    describe('checkNodeHealth', () => {
      beforeEach(() => {
        (child_process as any).exec.mockImplementation((_command, callback) => {
          callback(
            null,
            'Connection to 162.210.199.42 8545 port [tcp/*] succeeded!',
            null,
          );
        });
      });

      /* Node OFFLINE Check Tests */
      test('Should return an OFFLINE response if the node has its own endpoint and returns the correct healthy response', async () => {
        (child_process as any).exec.mockImplementation((_command, callback) => {
          callback(
            null,
            'nc: connect to 162.210.199.42 port 8545 (tcp) failed: Connection refused',
            null,
          );
        });

        const healthResponse = await healthService.checkNodeHealth(mockNodeParams);

        expect(healthResponse.name).toEqual(mockNodeParams.node.name);
        expect(healthResponse.status).toEqual(EErrorStatus.ERROR);
        expect(healthResponse.conditions).toEqual(EErrorConditions.OFFLINE);
      });

      /* Node NO_RESPONSE Check Tests */
      test('Should return a NO_RESPONSE response if the checkNodeRPC throws an error', async () => {
        mockedAxios.get.mockRejectedValueOnce(new Error('whatever'));

        const healthResponse = await healthService.checkNodeHealth(mockNodeParams);

        expect(healthResponse.name).toEqual(mockNodeParams.node.name);
        expect(healthResponse.status).toEqual(EErrorStatus.ERROR);
        expect(healthResponse.conditions).toEqual(EErrorConditions.NO_RESPONSE);
        expect(healthResponse.error).toEqual('whatever');
      });

      /* Has-Own-Endpoint Tests */
      test('Should return a HEALTHY response if the node has its own endpoint and returns the correct healthy response', async () => {
        const mockNodeForHealthy = {
          ...mockNodeParams,
          node: {
            ...mockNodeParams.node,
            chain: {
              ...mockNodeParams.node.chain,
              hasOwnEndpoint: true,
              responsePath: 'status',
              healthyValue: '200',
            },
          },
        };
        const mockResponse = { data: { result: "hi I'm healthy" }, status: 200 };
        mockedAxios.get.mockResolvedValueOnce(mockResponse);

        const healthResponse = await healthService.checkNodeHealth(mockNodeForHealthy);

        expect(healthResponse.name).toEqual(mockNodeParams.node.name);
        expect(healthResponse.status).toEqual(EErrorStatus.OK);
        expect(healthResponse.conditions).toEqual(EErrorConditions.HEALTHY);
        expect(healthResponse.health).toEqual("hi I'm healthy");
      });

      test('Should return a NOT_SYNCHRONIZED response if the node has its own endpoint and returns the correct healthy response', async () => {
        const mockNodeForNotSynced = {
          ...mockNodeParams,
          node: {
            ...mockNodeParams.node,
            chain: {
              ...mockNodeParams.node.chain,
              hasOwnEndpoint: true,
              responsePath: 'status',
              healthyValue: '200',
            },
          },
        };
        const mockResponse = { data: { result: "oops I'm not healthy" }, status: 500 };
        mockedAxios.get.mockResolvedValueOnce(mockResponse);

        const healthResponse = await healthService.checkNodeHealth(mockNodeForNotSynced);

        expect(healthResponse.name).toEqual(mockNodeParams.node.name);
        expect(healthResponse.status).toEqual(EErrorStatus.ERROR);
        expect(healthResponse.conditions).toEqual(EErrorConditions.NOT_SYNCHRONIZED);
        expect(healthResponse.health).toEqual("oops I'm not healthy");
      });

      /* Oracles Tests */
      const mockNodeForOracles = {
        ...mockNodeParams,
        node: {
          ...mockNodeParams.node,
          chain: {
            name: 'ETH',
            allowance: 3,
            rpc: '{ "jsonrpc": "2.0", "id": 1, "method": "eth_blockNumber", "params": [] }',
            useOracles: true,
            responsePath: 'data.result',
          } as unknown as IChain,
        },
      };

      test('Should return a HEALTHY response if the node uses oracles, is in sync and the oracles are healthy', async () => {
        const mockResponse = { data: { result: 657289 } };
        mockedAxios.post.mockResolvedValueOnce(mockResponse);
        mockedAxios.post.mockResolvedValueOnce({ data: { result: 657271 } });
        mockedAxios.post.mockResolvedValueOnce({ data: { result: 657291 } });

        const healthResponse = await healthService.checkNodeHealth(mockNodeForOracles);

        expect(healthResponse.name).toEqual(mockNodeParams.node.name);
        expect(healthResponse.status).toEqual(EErrorStatus.OK);
        expect(healthResponse.conditions).toEqual(EErrorConditions.HEALTHY);
        expect(healthResponse.health).toEqual('Node is healthy.');
        expect(healthResponse.height.internalHeight).toEqual(657289);
        expect(healthResponse.height.externalHeight).toEqual(657291);
        expect(healthResponse.height.delta).toEqual(2);
      });

      test('Should return a HEALTHY response if the node uses oracles, is in sync and there are less than 2 healthy oracles but more than 2 healthy peers', async () => {
        const mockResponse = { data: { result: 657271 } };
        mockedAxios.post.mockResolvedValueOnce(mockResponse);
        mockedAxios.post.mockRejectedValueOnce(new Error('bad oracle'));
        mockedAxios.post.mockRejectedValueOnce(new Error('bad oracle'));
        const [first, second] = [
          { data: { result: 657271 } },
          { data: { result: 657271 } },
        ];
        mockedAxios.post.mockResolvedValueOnce(first);
        mockedAxios.post.mockResolvedValueOnce(second);

        const healthResponse = await healthService.checkNodeHealth(mockNodeForOracles);

        expect(healthResponse.name).toEqual(mockNodeParams.node.name);
        expect(healthResponse.status).toEqual(EErrorStatus.OK);
        expect(healthResponse.conditions).toEqual(EErrorConditions.HEALTHY);
        expect(healthResponse.health).toEqual('Node is healthy.');
        expect(healthResponse.height.internalHeight).toEqual(657271);
        expect(healthResponse.height.externalHeight).toEqual(657271);
        expect(healthResponse.height.delta).toEqual(0);
        expect(healthResponse.details.badOracles.length).toEqual(2);
        expect(healthResponse.details.noOracle).toEqual(true);
      });

      test('Should return a NOT_SYNCHRONIZED response if the node uses oracles, the oracles are healthy and the delta is above the chains allowance', async () => {
        const mockResponse = { data: { result: 657251 } };
        mockedAxios.post.mockResolvedValueOnce(mockResponse);
        mockedAxios.post.mockResolvedValueOnce({ data: { result: 657271 } });
        mockedAxios.post.mockResolvedValueOnce({ data: { result: 657291 } });
        jest.spyOn(healthService as any, 'updateNotSynced').mockImplementation(jest.fn);

        const healthResponse = await healthService.checkNodeHealth(mockNodeForOracles);

        expect(healthResponse.name).toEqual(mockNodeParams.node.name);
        expect(healthResponse.status).toEqual(EErrorStatus.ERROR);
        expect(healthResponse.conditions).toEqual(EErrorConditions.NOT_SYNCHRONIZED);
        expect(healthResponse.health).toEqual('Node is out of sync.');
        expect(healthResponse.height.internalHeight).toEqual(657251);
        expect(healthResponse.height.externalHeight).toEqual(657291);
        expect(healthResponse.height.delta).toEqual(40);
      });

      test('Should return a NO_PEERS response if the node uses oracles but there are no healthy oracles and less than 2 healthy peers', async () => {
        const mockResponse = { data: { result: 657271 } };
        mockedAxios.post.mockResolvedValueOnce(mockResponse);
        mockedAxios.post.mockRejectedValueOnce(new Error('bad oracle'));
        mockedAxios.post.mockRejectedValueOnce(new Error('bad oracle'));

        const mockNodeForNotEnoughOracles = { ...mockNodeForOracles, oracles: [] };
        const healthResponse = await healthService.checkNodeHealth(
          mockNodeForNotEnoughOracles,
        );

        expect(healthResponse.name).toEqual(mockNodeParams.node.name);
        expect(healthResponse.status).toEqual(EErrorStatus.ERROR);
        expect(healthResponse.conditions).toEqual(EErrorConditions.NO_PEERS);
      });

      /* Peers Tests */
      const mockNodeForPeers = {
        ...mockNodeParams,
        node: {
          ...mockNodeParams.node,
          chain: {
            name: 'POKT',
            allowance: 1,
            endpoint: '/v1/query/height',
            rpc: '{}',
            useOracles: false,
            responsePath: 'data.height',
          } as unknown as IChain,
        },
      };

      test("Should return a HEALTHY response if the node doesn't use oracles, the peers are healthy and the node is in sync with its peers", async () => {
        const mockResponse = { data: { height: 32453 } };
        mockedAxios.post.mockResolvedValueOnce(mockResponse);
        const [first, second] = [
          { data: { height: 32453 } },
          { data: { height: 32427 } },
        ];
        mockedAxios.post.mockResolvedValueOnce(first);
        mockedAxios.post.mockResolvedValueOnce(second);

        const healthResponse = await healthService.checkNodeHealth(mockNodeForPeers);

        expect(healthResponse.name).toEqual(mockNodeParams.node.name);
        expect(healthResponse.status).toEqual(EErrorStatus.OK);
        expect(healthResponse.conditions).toEqual(EErrorConditions.HEALTHY);
        expect(healthResponse.health).toEqual('Node is healthy.');
        expect(healthResponse.height.internalHeight).toEqual(32453);
        expect(healthResponse.height.externalHeight).toEqual(32453);
        expect(healthResponse.height.delta).toEqual(0);
      });

      test("Should return a NOT_SYNCHRONIZED response if the node doesn't use oracles, no peers are healthy or the node is out of sync with its peers", async () => {
        const mockResponse = { data: { height: 32453 } };
        mockedAxios.post.mockResolvedValueOnce(mockResponse);
        const [first, second] = [
          { data: { height: 32453 } },
          { data: { height: 32483 } },
        ];
        mockedAxios.post.mockResolvedValueOnce(first);
        mockedAxios.post.mockResolvedValueOnce(second);
        jest.spyOn(healthService as any, 'updateNotSynced').mockImplementation(jest.fn);

        const healthResponse = await healthService.checkNodeHealth(mockNodeForPeers);

        expect(healthResponse.name).toEqual(mockNodeParams.node.name);
        expect(healthResponse.status).toEqual(EErrorStatus.ERROR);
        expect(healthResponse.conditions).toEqual(EErrorConditions.NOT_SYNCHRONIZED);
        expect(healthResponse.health).toEqual('Node is out of sync.');
        expect(healthResponse.height.internalHeight).toEqual(32453);
        expect(healthResponse.height.externalHeight).toEqual(32483);
        expect(healthResponse.height.delta).toEqual(30);
      });
    });

    /* Private method tests */
    describe('isNodeListening', () => {
      test('Should return true if the nc call to the node returns a sucess response', async () => {
        (child_process as any).exec.mockImplementation((_command, callback) => {
          callback(
            null,
            'Connection to 162.210.199.42 8545 port [tcp/*] succeeded!',
            null,
          );
        });

        const isNodeListening = await healthService['isNodeListening']({
          host: mockNodeParams.node.host.ip,
          port: mockNodeParams.node.port,
        });

        expect(isNodeListening).toEqual(true);
      });

      test('Should return false if the nc call to the node does not return a sucess response', async () => {
        (child_process as any).exec.mockImplementation((_command, callback) => {
          callback(
            null,
            'nc: connect to 162.210.199.42 port 8545 (tcp) failed: Connection refused',
            null,
          );
        });

        const isNodeListening = await healthService['isNodeListening']({
          host: mockNodeParams.node.host.ip,
          port: mockNodeParams.node.port,
        });

        expect(isNodeListening).toEqual(false);
      });

      test('Should return false if the nc call to the node throws an error', async () => {
        (child_process as any).exec.mockImplementation((_command, callback) => {
          callback('an error occurred calling nc', null, null);
        });

        const isNodeListening = await healthService['isNodeListening']({
          host: mockNodeParams.node.host.ip,
          port: mockNodeParams.node.port,
        });

        expect(isNodeListening).toEqual(false);
      });
    });

    describe('checkNodeRPC', () => {
      test('Should return an RPC result if Node is responding for GET RPC', async () => {
        const mockRpc = { data: 'anything', status: 200 };
        mockedAxios.get.mockResolvedValueOnce(mockRpc);

        const response = await healthService['checkNodeRPC'](mockNodeParams.node);

        expect(response.data).toBeTruthy();
        expect(response.status).toEqual(mockRpc.status);
      });

      test('Should return an RPC result if Node is responding for POST RPC', async () => {
        const mockNodeForPut = {
          ...mockNodeParams.node,
          chain: {
            ...mockNodeParams.node.chain,
            rpc: '{ "jsonrpc": "2.0", "id": 1, "method": "eth_blockNumber", "params": [] }',
          },
        };
        const mockRpc = { data: 'anything', status: 200 };
        mockedAxios.post.mockResolvedValueOnce(mockRpc);

        const response = await healthService['checkNodeRPC'](mockNodeForPut);

        expect(response.data).toBeTruthy();
        expect(response.status).toEqual(mockRpc.status);
      });

      test('Should throw an error if Node is not responding', async () => {
        mockedAxios.get.mockRejectedValueOnce(new Error('whatever'));

        let rpcResponse;
        try {
          rpcResponse = await healthService['checkNodeRPC'](mockNodeParams.node);
        } catch (error) {
          expect(rpcResponse).toBeFalsy();
          expect(error instanceof Error).toEqual(true);
          expect(error.message).toEqual('whatever');
        }
      });
    });

    /* checkHealthCheckField is for chains with their own provided health endpoint only */
    describe('checkHealthCheckField', () => {
      test('Should return true for ALG healthy response', async () => {
        const mockResponse = { data: { result: "hi I'm healthy" }, status: 200 };
        const response = healthService['checkHealthCheckField'](
          mockResponse as AxiosResponse<{ result: string }>,
          'status',
          '200',
        );

        expect(response).toEqual(true);
      });
      test('Should return false for ALG unhealthy response', async () => {
        const mockResponse = { data: { result: "boo I'm out of sync" }, status: 500 };
        const response = healthService['checkHealthCheckField'](
          mockResponse as AxiosResponse<{ result: string }>,
          'status',
          '200',
        );

        expect(response).toEqual(false);
      });

      test('Should return true for AVAX healthy response', async () => {
        const mockResponse = { data: { result: { healthy: true } }, status: 200 };
        const response = healthService['checkHealthCheckField'](
          mockResponse as AxiosResponse<{ result: { healthy: boolean } }>,
          'data.result.healthy',
          'true',
        );

        expect(response).toEqual(true);
      });
      test('Should return false for AVAX unhealthy response', async () => {
        const mockResponse = { data: { result: { healthy: false } }, status: 200 };
        const response = healthService['checkHealthCheckField'](
          mockResponse as AxiosResponse<{ result: { healthy: boolean } }>,
          'data.result.healthy',
          'true',
        );

        expect(response).toEqual(false);
      });

      test('Should return true for SOL healthy response', async () => {
        const mockResponse = { data: { result: 'ok' }, status: 200 };
        const response = healthService['checkHealthCheckField'](
          mockResponse as AxiosResponse<{ result: string }>,
          'data.result',
          'ok',
        );

        expect(response).toEqual(true);
      });
      test('Should return false for SOL unhealthy response', async () => {
        const mockResponse = { data: { result: 'not ok' }, status: 200 };
        const response = healthService['checkHealthCheckField'](
          mockResponse as AxiosResponse<{ result: string }>,
          'data.result',
          'ok',
        );

        expect(response).toEqual(false);
      });

      test('Should return true for TMT healthy response', async () => {
        const mockResponse = {
          data: { result: { sync_info: { catching_up: false } } },
          status: 200,
        };
        const response = healthService['checkHealthCheckField'](
          mockResponse as AxiosResponse<{
            result: { sync_info: { catching_up: boolean } };
          }>,
          'data.result.sync_info.catching_up',
          'false',
        );

        expect(response).toEqual(true);
      });
      test('Should return false for TMT unhealthy response', async () => {
        const mockResponse = {
          data: { result: { sync_info: { catching_up: true } } },
          status: 200,
        };
        const response = healthService['checkHealthCheckField'](
          mockResponse as AxiosResponse<{
            result: { sync_info: { catching_up: boolean } };
          }>,
          'data.result.sync_info.catching_up',
          'false',
        );

        expect(response).toEqual(false);
      });
    });

    /* getReferenceBlockHeight returns the highest block height among the node's references - oracles and/or peers */
    describe('getReferenceBlockHeight', () => {
      const mockPeers = ['https://whatever1.com', 'https://whatever2.com'];

      test('Should return the highest block height for a node that uses oracles and has two healthy oracles', async () => {
        const mockOracle = {
          chain: 'TST',
          urls: [
            'https://whatever1.com',
            'https://whatever2.com',
            'https://whatever3.com',
          ],
        };
        const [first, second, third] = [
          { data: { result: 61573 } },
          { data: { result: 61582 } },
          { data: { result: 61571 } },
        ];
        const mockNodeForOracles = {
          chain: {
            name: 'ETH',
            rpc: '{ "jsonrpc": "2.0", "id": 1, "method": "eth_blockNumber", "params": [] }',
            useOracles: true,
            responsePath: 'data.result',
          },
        } as unknown as INode;

        mockedAxios.post.mockResolvedValueOnce(first);
        mockedAxios.post.mockResolvedValueOnce(second);
        mockedAxios.post.mockResolvedValueOnce(third);

        const { refHeight, badOracles } = await healthService['getReferenceBlockHeight']({
          node: mockNodeForOracles,
          oracles: mockOracle.urls,
        });

        expect(refHeight).toEqual(61582);
        expect(badOracles).toBeFalsy();
      });

      test('Should return the highest block height for a node that uses oracles but has less than two healthy oracles and 2 or more healthy peers', async () => {
        const mockOracle = { chain: 'TST', urls: ['https://whatever1.com'] };
        const [first, second] = [
          { data: { result: 61573 } },
          { data: { result: 61571 } },
        ];
        const mockNodeForOracles = {
          chain: {
            name: 'TST',
            rpc: '{ "jsonrpc": "2.0", "id": 1, "method": "eth_blockNumber", "params": [] }',
            useOracles: true,
            responsePath: 'data.result',
          },
        } as unknown as INode;

        mockedAxios.post.mockResolvedValueOnce(first);
        mockedAxios.post.mockResolvedValueOnce(second);

        const { refHeight, badOracles } = await healthService['getReferenceBlockHeight']({
          node: mockNodeForOracles,
          oracles: mockOracle.urls,
          peers: mockPeers,
        });

        expect(refHeight).toEqual(61573);
        expect(badOracles).toBeFalsy();
      });

      test('Should return the highest block height for a node that uses peers instead of oracles', async () => {
        const [first, second] = [
          { data: { height: 61573 } },
          { data: { height: 61582 } },
        ];
        const mockNodeForPeers = {
          chain: {
            name: 'POKT',
            endpoint: '/v1/query/height',
            rpc: '{}',
            useOracles: false,
            responsePath: 'data.height',
          },
        } as unknown as INode;

        mockedAxios.post.mockResolvedValueOnce(first);
        mockedAxios.post.mockResolvedValueOnce(second);

        const { refHeight, badOracles } = await healthService['getReferenceBlockHeight']({
          node: mockNodeForPeers,
          peers: mockPeers,
        });

        expect(refHeight).toEqual(61582);
        expect(badOracles).toBeFalsy();
      });
    });

    describe('getHighestHeight', () => {
      test('Should return the highest block height', async () => {
        const mockBlockHeights = [5, 3, 7, 8, 2, 3, 5, 6, 9, 7, 8, 2, 4];

        const highest = healthService['getHighestHeight'](mockBlockHeights);

        expect(highest).toEqual(9);
      });
    });

    describe('getHealthyValueType', () => {
      test('Should return the correct value if it is a string', async () => {
        const stringValue = 'healthy';

        const string = healthService['getHealthyValueType'](stringValue);

        expect(string).toEqual('healthy');
      });

      test('Should return the correct value if it is a number', async () => {
        const stringValue = '200';

        const number = healthService['getHealthyValueType'](stringValue);

        expect(number).toEqual(200);
      });

      test('Should return the correct value if it is a boolean', async () => {
        const stringTrue = 'true';
        const stringFalse = 'fAlSe';

        const trueVal = healthService['getHealthyValueType'](stringTrue);
        const falseVal = healthService['getHealthyValueType'](stringFalse);

        expect(trueVal).toEqual(true);
        expect(falseVal).toEqual(false);
      });
    });

    /* getOracleBlockHeights is for chains with their own provided health endpoint only */
    describe('getOracleBlockHeights', () => {
      const mockOracle = {
        chain: 'TST',
        urls: ['https://whatever1.com', 'https://whatever2.com', 'https://whatever3.com'],
      };
      const [first, second, third] = [
        { data: { result: 61573 } },
        { data: { result: 61582 } },
        { data: { result: 61571 } },
      ];
      const mockNodeForOracles = {
        chain: {
          name: 'ETH',
          rpc: '{ "jsonrpc": "2.0", "id": 1, "method": "eth_blockNumber", "params": [] }',
          useOracles: true,
          responsePath: 'data.result',
        },
      } as unknown as INode;

      test('Should return two block heights from external oracle endpoints if all oracles are healthy', async () => {
        mockedAxios.post.mockResolvedValueOnce(first);
        mockedAxios.post.mockResolvedValueOnce(second);
        mockedAxios.post.mockResolvedValueOnce(third);

        const { oracleHeights, badOracles } = await healthService[
          'getOracleBlockHeights'
        ](mockNodeForOracles, mockOracle.urls);

        expect(oracleHeights.length).toEqual(2);
        expect(badOracles.length).toEqual(0);
        expect(oracleHeights).toContain(first.data.result);
        expect(oracleHeights).toContain(second.data.result);
        expect(oracleHeights[2]).toBeFalsy();
      });

      test('Should return two block heights and parse hex codes to numbers', async () => {
        const [first, second, third] = [
          { data: { result: 'F085' } },
          { data: { result: 'F08E' } },
          { data: { result: 61571 } },
        ];
        mockedAxios.post.mockResolvedValueOnce(first);
        mockedAxios.post.mockResolvedValueOnce(second);
        mockedAxios.post.mockResolvedValueOnce(third);

        const { oracleHeights, badOracles } = await healthService[
          'getOracleBlockHeights'
        ](mockNodeForOracles, mockOracle.urls);

        expect(oracleHeights.length).toEqual(2);
        expect(badOracles.length).toEqual(0);
        expect(oracleHeights).toContain(hexToDec(first.data.result));
        expect(oracleHeights).toContain(hexToDec(second.data.result));
        expect(oracleHeights).toContain(61573);
        expect(oracleHeights).toContain(61582);
        expect(oracleHeights[2]).toBeFalsy();
      });

      test('Should return a bad oracle URL if one of the oracles is unhealthy', async () => {
        mockedAxios.post.mockResolvedValueOnce(first);
        mockedAxios.post.mockRejectedValueOnce(new Error('bad oracle'));
        mockedAxios.post.mockResolvedValueOnce(third);

        const { oracleHeights, badOracles } = await healthService[
          'getOracleBlockHeights'
        ](mockNodeForOracles, mockOracle.urls);

        expect(oracleHeights.length).toEqual(2);
        expect(badOracles.length).toEqual(1);
        expect(oracleHeights).toContain(first.data.result);
        expect(oracleHeights).toContain(third.data.result);
      });
    });

    /* getPeerBlockHeights is for chains that don't use external oracles or have less than 2 healthy oracle urls */
    describe('getPeerBlockHeights', () => {
      const mockPeers = [
        'https://whatever1.com',
        'https://whatever2.com',
        'https://whatever3.com',
      ];
      const [first, second, third] = [
        { data: { height: 61573 } },
        { data: { height: 61582 } },
        { data: { height: 61571 } },
      ];
      const mockNodeForPeers = {
        chain: {
          name: 'POKT',
          endpoint: '/v1/query/height',
          rpc: '{}',
          useOracles: false,
          responsePath: 'data.height',
        },
      } as unknown as INode;

      test("Should return all block heights from node's peers if the peers are all healthy", async () => {
        mockedAxios.post.mockResolvedValueOnce(first);
        mockedAxios.post.mockResolvedValueOnce(second);
        mockedAxios.post.mockResolvedValueOnce(third);

        const peerBlockHeights = await healthService['getPeerBlockHeights'](
          mockNodeForPeers,
          mockPeers,
        );

        expect(peerBlockHeights.length).toEqual(3);
        expect(peerBlockHeights).toContain(first.data.height);
        expect(peerBlockHeights).toContain(second.data.height);
        expect(peerBlockHeights).toContain(third.data.height);
      });

      test("Should return all healthy block heights from node's peers if any peers are not responding", async () => {
        jest
          .spyOn(NodesModel, 'aggregate')
          .mockImplementationOnce(() => mockPeers as any);
        mockedAxios.post.mockResolvedValueOnce(first);
        mockedAxios.post.mockRejectedValueOnce(new Error('peer not responding'));
        mockedAxios.post.mockResolvedValueOnce(third);

        const peerBlockHeights = await healthService['getPeerBlockHeights'](
          mockNodeForPeers,
          mockPeers,
        );

        expect(peerBlockHeights.length).toEqual(2);
        expect(peerBlockHeights).toContain(first.data.height);
        expect(peerBlockHeights).toContain(third.data.height);
      });
    });
  });
});

describe('getDeltaArray', () => {
  test('Should return a single value if the deltaArray does not exist', async () => {
    const testDelta = 12345;
    const testDeltaArray = undefined;

    const newArray = healthService['getDeltaArray'](testDelta, testDeltaArray);

    expect(newArray[0]).toEqual(testDelta);
  });

  test('Should add the new delta to the end of the deltaArray if the deltaArray exists', async () => {
    const testDelta = 12345;
    const testDeltaArray = [45678, 84732];

    const newArray = healthService['getDeltaArray'](testDelta, testDeltaArray);

    expect(newArray[0]).toEqual(testDeltaArray[0]);
    expect(newArray[newArray.length - 1]).toEqual(testDelta);
  });

  test('Should not exceed the retrigger threshold in length', async () => {
    const testDelta = 12345;
    const testDeltaArray = [];
    [...new Array(120)].forEach(() => {
      testDeltaArray.push(randomInt(12345, 45678));
    });

    const newArray = healthService['getDeltaArray'](testDelta, testDeltaArray);

    expect(newArray.length).toEqual(120);
  });
});

describe('getSecondsToRecover', () => {
  test('Should return an estimated time to recover for a decreasing delta', async () => {
    const testDeltaArray = [653485];
    [...new Array(120)].forEach((_, i) => {
      testDeltaArray.push(testDeltaArray[i] - randomInt(45, 89));
    });

    const testSeconds = healthService['getSecondsToRecover'](testDeltaArray);

    expect(testSeconds).toBeGreaterThan(0);
    expect(testSeconds).toBeGreaterThan(80000);
    expect(testSeconds).toBeLessThan(120000);
  });

  test('Should return -1 for an increasing delta', async () => {
    const testDeltaArray = [653485];
    [...new Array(120)].forEach((_, i) => {
      testDeltaArray.push(testDeltaArray[i] + randomInt(45, 89));
    });

    const testSeconds = healthService['getSecondsToRecover'](testDeltaArray);

    expect(testSeconds).toEqual(-1);
  });

  test('Should return 0 for a stuck delta', async () => {
    const testDeltaArray = [653485];
    [...new Array(120)].forEach(() => {
      testDeltaArray.push(653485);
    });

    const testSeconds = healthService['getSecondsToRecover'](testDeltaArray);

    expect(testSeconds).toEqual(0);
  });
});
