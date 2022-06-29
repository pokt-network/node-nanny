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

      const [firstOccurrence, elapsed] = messageString.split('\n');

      expect(firstOccurrence).toContain(`First occurrence of this error was`);
      expect(elapsed).toEqual(`Error has been occurring for 1 minute, 15 seconds.`);
    });

    test('Should return a string for an error event that occurred for less than two monitor intervals', async () => {
      const lessThanTwoIntervals = new Date(Date.now() - 1000 * 10 - 1000).toUTCString();

      const messageString = alertService['getErrorTimeElapsedString'](
        lessThanTwoIntervals,
        EAlertTypes.TRIGGER,
      );

      const [firstOccurrence, elapsed] = messageString.split('\n');

      expect(firstOccurrence).toContain('First occurrence of this error was');
      expect(elapsed).toEqual(undefined);
    });

    test('Should return a string for a resolved event', async () => {
      const lessThanMinuteAgo = new Date(Date.now() - 1000 * 60).toUTCString();

      const messageString = alertService['getErrorTimeElapsedString'](
        lessThanMinuteAgo,
        EAlertTypes.RESOLVED,
      );

      const [firstOccurrence, elapsed] = messageString.split('\n');

      expect(firstOccurrence).toContain('First occurrence of this error was');
      expect(elapsed).toEqual('Error occurred for 1 minute.');
    });

    test('Should return a string for a resolved event that occurred for less than two monitor intervals', async () => {
      const lessThanTwoIntervals = new Date(Date.now() - 1000 * 10 - 1000).toUTCString();

      const messageString = alertService['getErrorTimeElapsedString'](
        lessThanTwoIntervals,
        EAlertTypes.RESOLVED,
      );

      const [firstOccurrence, elapsed] = messageString.split('\n');

      expect(firstOccurrence).toContain('First occurrence of this error was');
      expect(elapsed).toEqual('Error occurred for less than 20 seconds.');
    });
  });
});
