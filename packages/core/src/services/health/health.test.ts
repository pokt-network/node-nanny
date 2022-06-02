import { Service } from './service';

const healthService = new Service();

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

describe('Health Service Tests', () => {
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

  describe('getNEARBlockHeight', () => {
    test('Should return blockHeight for NEAR Internal Node URL', async () => {
      const NEARInternalUrl = 'http://near:6ChMDr507RK7mWoMse54@near-altruist.us-east.thunderstake.io';
      const response = await healthService['getNEARBlockHeight'](NEARInternalUrl);
      expect(response).toBeDefined();
      expect(response > 0).toBeTruthy();
    });
    test('Should return blockHeight for NEAR External Node URL', async () => {
      const NEARExternalUrl = 'https://rpc.mainnet.near.org';
      const response = await healthService['getNEARBlockHeight'](NEARExternalUrl);
      expect(response).toBeDefined();
      expect(response > 0).toBeTruthy();
    });
  });
});
