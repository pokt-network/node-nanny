import axios, { AxiosResponse } from 'axios';

import { Service } from './service';
import { EErrorConditions, EErrorStatus } from './types';
import { INode } from '../../models';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.create.mockImplementation((_config) => axios);
const healthService = new Service();

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

describe('Health Service Tests', () => {
  describe.only('Chain-agnostic Health Check Tests', () => {
    const mockNode = {
      name: 'TEST-HOST/TST/01',
      chain: { method: 'get', path: '/health' },
      url: 'http://162.210.199.42:8545',
      basicAuth: null,
    } as unknown as INode;

    describe('checkNodeHealth', () => {
      test('Should return a NO_RESPONSE health check if the checkNodeRPC throws an error', async () => {
        mockedAxios.get.mockRejectedValueOnce(new Error('whatever'));

        const healthResponse = await healthService.checkNodeHealth(mockNode);

        expect(healthResponse.name).toEqual(mockNode.name);
        expect(healthResponse.status).toEqual(EErrorStatus.ERROR);
        expect(healthResponse.conditions).toEqual(EErrorConditions.NO_RESPONSE);
        expect(healthResponse.error).toEqual('whatever');
      });

      test('Should return a HEALTHY health check if the node has its own endpoint and returns the correct healthy response', async () => {
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

      test('Should return a NOT_SYNCHRONIZED health check if the node has its own endpoint and returns the correct healthy response', async () => {
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
