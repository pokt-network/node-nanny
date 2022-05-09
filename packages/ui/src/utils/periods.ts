const ONE_MINUTE = 60 * 1000;
const ONE_HOUR = ONE_MINUTE * 60;
const ONE_DAY = ONE_HOUR * 24;

export interface ITimePeriod {
  code: string;
  label: string;
  timePeriod: string;
  numPeriods: number;
  increment: number;
  format: string;
}

export const timePeriods: ITimePeriod[] = [
  {
    code: '15M',
    label: 'Past 15 Minutes',
    timePeriod: 'minute',
    numPeriods: 15,
    increment: ONE_MINUTE,
    format: 'HH:mm',
  },
  {
    code: '1H',
    label: 'Past 2 Hours',
    timePeriod: 'hour',
    numPeriods: 1,
    increment: ONE_MINUTE * 5,
    format: 'HH:mm',
  },
  {
    code: '4H',
    label: 'Past 4 Hours',
    timePeriod: 'hour',
    numPeriods: 4,
    increment: ONE_MINUTE * 15,
    format: 'HH:mm',
  },
  {
    code: '1D',
    label: 'Past 1 Day',
    timePeriod: 'day',
    numPeriods: 1,
    increment: ONE_HOUR,
    format: 'HH:mm',
  },
  {
    code: '2D',
    label: 'Past 2 Days',
    timePeriod: 'day',
    numPeriods: 2,
    increment: ONE_HOUR * 3,
    format: 'HH:mm',
  },
  {
    code: '3D',
    label: 'Past 3 Days',
    timePeriod: 'day',
    numPeriods: 3,
    increment: ONE_HOUR * 6,
    format: 'HH:mm',
  },
  {
    code: '7D',
    label: 'Past 7 Days',
    timePeriod: 'day',
    numPeriods: 7,
    increment: ONE_HOUR * 12,
    format: 'HH:mm',
  },
  {
    code: '15D',
    label: 'Past 15 Days',
    timePeriod: 'day',
    numPeriods: 15,
    increment: ONE_DAY,
    format: 'ddd MMM DD',
  },
  {
    code: '1MO',
    label: 'Past 1 Month',
    timePeriod: 'month',
    numPeriods: 1,
    increment: ONE_DAY * 2,
    format: 'ddd, MMM DD',
  },
];
