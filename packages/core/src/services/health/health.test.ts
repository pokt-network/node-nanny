import { Service } from './service';

const healthService = new Service();

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

describe('Health Service Tests', () => {
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

    test('Should return -1 for for a decreasing delta', async () => {
      const testDeltaArray = [653485];

      [...new Array(120)].forEach((_, i) => {
        testDeltaArray.push(testDeltaArray[i] + randomInt(45, 89));
      });

      const testSeconds = healthService['getSecondsToRecover'](testDeltaArray);

      expect(testSeconds).toEqual(-1);
    });

    test('Should return 0 for for a stuck delta', async () => {
      const testDeltaArray = [653485];

      [...new Array(120)].forEach(() => {
        testDeltaArray.push(653485);
      });

      const testSeconds = healthService['getSecondsToRecover'](testDeltaArray);

      expect(testSeconds).toEqual(0);
    });
  });
});
