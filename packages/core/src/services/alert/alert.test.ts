import { Service } from './service';
import { EAlertTypes } from '../event/types';

const alertService = new Service();

describe('Alert Service Tests', () => {
  describe('getErrorTimeElapsedString', () => {
    test('Should return a string for an error event that occurred over a minute ago', async () => {
      const overAMinuteAgo = new Date(Date.now() - 1000 * 75).toUTCString();

      const messageString = alertService['getErrorTimeElapsedString'](
        overAMinuteAgo,
        EAlertTypes.TRIGGER,
      );

      expect(messageString).toContain(
        `Error has been occurring for 1 minute, 15 seconds`,
      );
    });

    test('Should return a string for an error event that occurred less than a minute ago', async () => {
      const lessThanMinuteAgo = new Date(Date.now() - 1000 * 45).toUTCString();

      const messageString = alertService['getErrorTimeElapsedString'](
        lessThanMinuteAgo,
        EAlertTypes.TRIGGER,
      );

      const [firstOccurrence, elapsed] = messageString.split('\n');
      expect(messageString).toContain(`First occurrence of this error was`);
      expect(firstOccurrence).toBeTruthy();
      expect(elapsed).toBeFalsy();
    });

    test('Should return a string for a resolved event', async () => {
      const lessThanMinuteAgo = new Date(Date.now() - 1000 * 90).toUTCString();

      const messageString = alertService['getErrorTimeElapsedString'](
        lessThanMinuteAgo,
        EAlertTypes.RESOLVED,
      );

      expect(messageString).toContain(`First occurrence of this error was`);
      expect(messageString).toContain(
        `Error had been occurring for 1 minute, 30 seconds`,
      );
    });
  });
});
