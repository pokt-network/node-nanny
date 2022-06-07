import axios, { AxiosResponse } from 'axios';

import { Service } from './service';
import { EErrorConditions, EErrorStatus } from './types';
import { INode, NodesModel, OraclesModel } from '../../models';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create.mockImplementation((_config) => axios);
const healthService = new Service();

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

describe('Health Service Tests', () => {
  describe('Chain-agnostic Health Check Tests', () => {
    const mockNode = {
      id: '123456789',
      name: 'TEST-HOST/TST/01',
      chain: { method: 'get', path: '/health' },
      url: 'http://162.210.199.42:8545',
      basicAuth: null,
    } as unknown as INode;

    describe('checkNodeHealth', () => {
      test('Should return a NO_RESPONSE response if the checkNodeRPC throws an error', async () => {
        mockedAxios.get.mockRejectedValueOnce(new Error('whatever'));

        const healthResponse = await healthService.checkNodeHealth(mockNode);

        expect(healthResponse.name).toEqual(mockNode.name);
        expect(healthResponse.status).toEqual(EErrorStatus.ERROR);
        expect(healthResponse.conditions).toEqual(EErrorConditions.NO_RESPONSE);
        expect(healthResponse.error).toEqual('whatever');
      });

      /* Has-Own-Endpoint Tests */

      test('Should return a HEALTHY response if the node has its own endpoint and returns the correct healthy response', async () => {
        const mockNodeForHealthy = {
          ...mockNode,
          chain: {
            ...mockNode.chain,
            hasOwnEndpoint: true,
            responsePath: 'status',
            healthyValue: 200,
          },
        };
        const mockResponse = { data: { result: "hi I'm healthy" }, status: 200 };
        mockedAxios.get.mockResolvedValueOnce(mockResponse);

        const healthResponse = await healthService.checkNodeHealth(mockNodeForHealthy);

        expect(healthResponse.name).toEqual(mockNode.name);
        expect(healthResponse.status).toEqual(EErrorStatus.OK);
        expect(healthResponse.conditions).toEqual(EErrorConditions.HEALTHY);
        expect(healthResponse.health).toEqual("hi I'm healthy");
      });

      test('Should return a NOT_SYNCHRONIZED response if the node has its own endpoint and returns the correct healthy response', async () => {
        const mockNodeForNotSynced = {
          ...mockNode,
          chain: {
            ...mockNode.chain,
            hasOwnEndpoint: true,
            responsePath: 'status',
            healthyValue: 200,
          },
        };
        const mockResponse = { data: { result: "oops I'm not healthy" }, status: 500 };
        mockedAxios.get.mockResolvedValueOnce(mockResponse);

        const healthResponse = await healthService.checkNodeHealth(mockNodeForNotSynced);

        expect(healthResponse.name).toEqual(mockNode.name);
        expect(healthResponse.status).toEqual(EErrorStatus.ERROR);
        expect(healthResponse.conditions).toEqual(EErrorConditions.NOT_SYNCHRONIZED);
        expect(healthResponse.health).toEqual("oops I'm not healthy");
      });

      /* Oracles Tests */
      const mockNodeForOracles = {
        ...mockNode,
        chain: {
          name: 'ETH',
          allowance: 3,
          method: 'post',
          rpc: { jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] },
          useOracles: true,
          responsePath: 'data.result',
        },
      };
      const mockOracle = {
        chain: 'ETH',
        urls: ['https://whatever1.com', 'https://whatever2.com'],
      };
      const mockPeers = [
        { url: 'https://whatever1.com' },
        { url: 'https://whatever2.com' },
      ] as unknown as INode[];

      test('Should return a HEALTHY response if the node uses oracles, the oracles are healthy and the node is in sync with its oracles', async () => {
        const mockResponse = { data: { result: 657289 } };
        mockedAxios.post.mockResolvedValueOnce(mockResponse);
        jest
          .spyOn(OraclesModel, 'findOne')
          .mockImplementationOnce(() => mockOracle as any);
        mockedAxios.post.mockResolvedValueOnce({ data: { result: 657271 } });
        mockedAxios.post.mockResolvedValueOnce({ data: { result: 657291 } });

        const healthResponse = await healthService.checkNodeHealth(mockNodeForOracles);

        expect(healthResponse.name).toEqual(mockNode.name);
        expect(healthResponse.status).toEqual(EErrorStatus.OK);
        expect(healthResponse.conditions).toEqual(EErrorConditions.HEALTHY);
        expect(healthResponse.health).toEqual('Node is healthy.');
        expect(healthResponse.height.internalHeight).toEqual(657289);
        expect(healthResponse.height.externalHeight).toEqual(657291);
        expect(healthResponse.height.delta).toEqual(2);
      });

      test('Should return a HEALTHY response if the node uses oracles and there are less than 2 healthy oracles but more than 2 healthy peers', async () => {
        const mockResponse = { data: { result: 657271 } };
        mockedAxios.post.mockResolvedValueOnce(mockResponse);
        jest
          .spyOn(OraclesModel, 'findOne')
          .mockImplementationOnce(() => mockOracle as any);
        mockedAxios.post.mockRejectedValueOnce(new Error('bad oracle'));
        mockedAxios.post.mockRejectedValueOnce(new Error('bad oracle'));
        const [first, second] = [
          { data: { result: 657271 } },
          { data: { result: 657271 } },
        ];
        jest
          .spyOn(NodesModel, 'aggregate')
          .mockImplementationOnce(() => mockPeers as any);
        mockedAxios.post.mockResolvedValueOnce(first);
        mockedAxios.post.mockResolvedValueOnce(second);

        const healthResponse = await healthService.checkNodeHealth(mockNodeForOracles);

        expect(healthResponse.name).toEqual(mockNode.name);
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
        jest
          .spyOn(OraclesModel, 'findOne')
          .mockImplementationOnce(() => mockOracle as any);
        mockedAxios.post.mockResolvedValueOnce({ data: { result: 657271 } });
        mockedAxios.post.mockResolvedValueOnce({ data: { result: 657291 } });
        jest.spyOn(healthService as any, 'updateNotSynced').mockImplementation(jest.fn);

        const healthResponse = await healthService.checkNodeHealth(mockNodeForOracles);

        expect(healthResponse.name).toEqual(mockNode.name);
        expect(healthResponse.status).toEqual(EErrorStatus.ERROR);
        expect(healthResponse.conditions).toEqual(EErrorConditions.NOT_SYNCHRONIZED);
        expect(healthResponse.health).toEqual('Node is out of sync.');
        expect(healthResponse.height.internalHeight).toEqual(657251);
        expect(healthResponse.height.externalHeight).toEqual(657291);
        expect(healthResponse.height.delta).toEqual(40);
      });

      test('Should return a NO_PEERS response if the node uses oracles but there are less than 2 healthy oracles and less than 2 healthy peers', async () => {
        const mockResponse = { data: { result: 657271 } };
        mockedAxios.post.mockResolvedValueOnce(mockResponse);
        jest
          .spyOn(OraclesModel, 'findOne')
          .mockImplementationOnce(() => mockOracle as any);
        mockedAxios.post.mockResolvedValueOnce({ data: { result: 657271 } });
        mockedAxios.post.mockRejectedValueOnce(new Error('bad oracles'));
        jest.spyOn(NodesModel, 'aggregate').mockImplementationOnce(() => [] as any);

        const healthResponse = await healthService.checkNodeHealth(mockNodeForOracles);

        expect(healthResponse.name).toEqual(mockNode.name);
        expect(healthResponse.status).toEqual(EErrorStatus.ERROR);
        expect(healthResponse.conditions).toEqual(EErrorConditions.NO_PEERS);
      });

      /* Peers Tests */
      const mockNodeForPeers = {
        ...mockNode,
        chain: {
          name: 'POKT',
          allowance: 1,
          method: 'post',
          endpoint: '/v1/query/height',
          rpc: {},
          useOracles: false,
          responsePath: 'data.height',
        },
      };

      test("Should return a HEALTHY response if the node doesn't use oracles, the peers are healthy and the node is in sync with its peers", async () => {
        const mockResponse = { data: { height: 32453 } };
        mockedAxios.post.mockResolvedValueOnce(mockResponse);
        const [first, second] = [
          { data: { height: 32453 } },
          { data: { height: 32427 } },
        ];
        jest
          .spyOn(NodesModel, 'aggregate')
          .mockImplementationOnce(() => mockPeers as any);
        mockedAxios.post.mockResolvedValueOnce(first);
        mockedAxios.post.mockResolvedValueOnce(second);

        const healthResponse = await healthService.checkNodeHealth(mockNodeForPeers);

        expect(healthResponse.name).toEqual(mockNode.name);
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
        jest
          .spyOn(NodesModel, 'aggregate')
          .mockImplementationOnce(() => mockPeers as any);
        mockedAxios.post.mockResolvedValueOnce(first);
        mockedAxios.post.mockResolvedValueOnce(second);
        jest.spyOn(healthService as any, 'updateNotSynced').mockImplementation(jest.fn);

        const healthResponse = await healthService.checkNodeHealth(mockNodeForPeers);

        expect(healthResponse.name).toEqual(mockNode.name);
        expect(healthResponse.status).toEqual(EErrorStatus.ERROR);
        expect(healthResponse.conditions).toEqual(EErrorConditions.NOT_SYNCHRONIZED);
        expect(healthResponse.health).toEqual('Node is out of sync.');
        expect(healthResponse.height.internalHeight).toEqual(32453);
        expect(healthResponse.height.externalHeight).toEqual(32483);
        expect(healthResponse.height.delta).toEqual(30);
      });
    });

    describe('checkNodeRPC', () => {
      test('Should return an RPC result if Node is responding for GET RPC', async () => {
        const mockRpc = { data: 'anything', status: 200 };
        mockedAxios.get.mockResolvedValueOnce(mockRpc);

        const response = await healthService['checkNodeRPC'](mockNode);

        expect(response.data).toBeTruthy();
        expect(response.status).toEqual(mockRpc.status);
      });

      test('Should return an RPC result if Node is responding for POST RPC', async () => {
        const mockNodeForPut = {
          ...mockNode,
          chain: {
            ...mockNode.chain,
            method: 'post',
            rpc: { jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] },
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
          rpcResponse = await healthService['checkNodeRPC'](mockNode);
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
          200,
        );

        expect(response).toEqual(true);
      });
      test('Should return false for ALG unhealthy response', async () => {
        const mockResponse = { data: { result: "boo I'm out of sync" }, status: 500 };
        const response = healthService['checkHealthCheckField'](
          mockResponse as AxiosResponse<{ result: string }>,
          'status',
          200,
        );

        expect(response).toEqual(false);
      });

      test('Should return true for AVAX healthy response', async () => {
        const mockResponse = { data: { result: { healthy: true } }, status: 200 };
        const response = healthService['checkHealthCheckField'](
          mockResponse as AxiosResponse<{ result: { healthy: boolean } }>,
          'data.result.healthy',
          true,
        );

        expect(response).toEqual(true);
      });
      test('Should return false for AVAX unhealthy response', async () => {
        const mockResponse = { data: { result: { healthy: false } }, status: 200 };
        const response = healthService['checkHealthCheckField'](
          mockResponse as AxiosResponse<{ result: { healthy: boolean } }>,
          'data.result.healthy',
          true,
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
          false,
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
          false,
        );

        expect(response).toEqual(false);
      });
    });

    /* getReferenceBlockHeight returns the highest block height among the node's references - oracles and/or peers */
    describe('getReferenceBlockHeight', () => {
      const mockPeers = [
        { url: 'https://whatever1.com' },
        { url: 'https://whatever2.com' },
      ] as unknown as INode[];

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
            method: 'post',
            rpc: { jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] },
            useOracles: true,
            responsePath: 'data.result',
          } as unknown as INode,
        };

        jest
          .spyOn(OraclesModel, 'findOne')
          .mockImplementationOnce(() => mockOracle as any);
        mockedAxios.post.mockResolvedValueOnce(first);
        mockedAxios.post.mockResolvedValueOnce(second);
        mockedAxios.post.mockResolvedValueOnce(third);

        const { refHeight, badOracles } = await healthService['getReferenceBlockHeight'](
          mockNodeForOracles,
        );

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
            method: 'post',
            rpc: { jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] },
            useOracles: true,
            responsePath: 'data.result',
          } as unknown as INode,
        };

        jest
          .spyOn(OraclesModel, 'findOne')
          .mockImplementationOnce(() => mockOracle as any);
        mockedAxios.post.mockResolvedValueOnce(first);
        jest
          .spyOn(NodesModel, 'aggregate')
          .mockImplementationOnce(() => mockPeers as any);
        mockedAxios.post.mockResolvedValueOnce(second);

        const { refHeight, badOracles } = await healthService['getReferenceBlockHeight'](
          mockNodeForOracles,
        );

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
            method: 'post',
            endpoint: '/v1/query/height',
            rpc: {},
            useOracles: false,
            responsePath: 'data.height',
          } as unknown as INode,
        };

        jest
          .spyOn(NodesModel, 'aggregate')
          .mockImplementationOnce(() => mockPeers as any);
        mockedAxios.post.mockResolvedValueOnce(first);
        mockedAxios.post.mockResolvedValueOnce(second);

        const { refHeight, badOracles } = await healthService['getReferenceBlockHeight'](
          mockNodeForPeers,
        );

        expect(refHeight).toEqual(61582);
        expect(badOracles).toBeFalsy();
      });
    });

    describe('sortBlockHeights', () => {
      test('Should return the highest block height', async () => {
        const mockBlockHeights = [5, 3, 7, 8, 2, 3, 5, 6, 9, 7, 8, 2, 4];

        const highest = healthService['sortBlockHeights'](mockBlockHeights);

        expect(highest).toEqual(9);
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
          method: 'post',
          rpc: { jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] },
          useOracles: true,
          responsePath: 'data.result',
        } as unknown as INode,
      };

      test('Should return two block heights from external oracle endpoints if all oracles are healthy', async () => {
        jest
          .spyOn(OraclesModel, 'findOne')
          .mockImplementationOnce(() => mockOracle as any);
        mockedAxios.post.mockResolvedValueOnce(first);
        mockedAxios.post.mockResolvedValueOnce(second);
        mockedAxios.post.mockResolvedValueOnce(third);

        const { oracleHeights, badOracles } = await healthService[
          'getOracleBlockHeights'
        ](mockNodeForOracles);

        expect(oracleHeights.length).toEqual(2);
        expect(badOracles.length).toEqual(0);
        expect(oracleHeights[0]).toEqual(first.data.result);
        expect(oracleHeights[1]).toEqual(second.data.result);
        expect(oracleHeights[2]).toBeFalsy();
      });

      test('Should return a bad oracle URL if one of the oracles is unhealthy', async () => {
        jest
          .spyOn(OraclesModel, 'findOne')
          .mockImplementationOnce(() => mockOracle as any);
        mockedAxios.post.mockResolvedValueOnce(first);
        mockedAxios.post.mockRejectedValueOnce(new Error('bad oracle'));
        mockedAxios.post.mockResolvedValueOnce(third);

        const { oracleHeights, badOracles } = await healthService[
          'getOracleBlockHeights'
        ](mockNodeForOracles);

        expect(oracleHeights.length).toEqual(2);
        expect(badOracles.length).toEqual(1);
        expect(oracleHeights[0]).toEqual(first.data.result);
        expect(oracleHeights[1]).toEqual(third.data.result);
        expect(badOracles[0]).toEqual('https://whatever2.com');
      });
    });

    /* getPeerBlockHeights is for chains that don't use external oracles or have less than 2 healthy oracle urls */
    describe('getPeerBlockHeights', () => {
      const mockPeers = [
        { url: 'https://whatever1.com' },
        { url: 'https://whatever2.com' },
        { url: 'https://whatever3.com' },
      ] as unknown as INode[];
      const [first, second, third] = [
        { data: { height: 61573 } },
        { data: { height: 61582 } },
        { data: { height: 61571 } },
      ];
      const mockNodeForPeers = {
        chain: {
          name: 'POKT',
          method: 'post',
          endpoint: '/v1/query/height',
          rpc: {},
          useOracles: false,
          responsePath: 'data.height',
        } as unknown as INode,
      };

      test("Should return all block heights from node's peers if the peers are all healthy", async () => {
        jest
          .spyOn(NodesModel, 'aggregate')
          .mockImplementationOnce(() => mockPeers as any);
        mockedAxios.post.mockResolvedValueOnce(first);
        mockedAxios.post.mockResolvedValueOnce(second);
        mockedAxios.post.mockResolvedValueOnce(third);

        const peerBlockHeights = await healthService['getPeerBlockHeights'](
          mockNodeForPeers,
        );

        expect(peerBlockHeights.length).toEqual(3);
        expect(peerBlockHeights[0]).toEqual(first.data.height);
        expect(peerBlockHeights[1]).toEqual(second.data.height);
        expect(peerBlockHeights[2]).toEqual(third.data.height);
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
        );

        expect(peerBlockHeights.length).toEqual(2);
        expect(peerBlockHeights[0]).toEqual(first.data.height);
        expect(peerBlockHeights[1]).toEqual(third.data.height);
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
