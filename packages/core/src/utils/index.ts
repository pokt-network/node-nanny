export const wait = async (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

export const hexToDec = (resultString: number | string): number => {
  return typeof resultString === "number" ? resultString : parseInt(resultString, 16);
};

export const getTimestamp = (): string => {
  const pad = (n: number, s = 2) => `${new Array(s).fill(0)}${n}`.slice(-s);
  const d = new Date();

  return `${pad(d.getFullYear(), 4)}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export const s = (count: number): string => (count === 1 ? "" : "s");
export const is = (count: number): string => (count === 1 ? "is" : "are");

export const camelToTitle = (camelCase: string): string =>
  camelCase
    .replace(/([A-Z])/g, (match) => ` ${match}`)
    .replace(/^./, (match) => match.toUpperCase())
    .trim();

const colorCodes = {
  red: "\x1B[31m%s\x1B[0m",
  green: "\x1B[32m%s\x1B[0m",
  yellow: "\x1B[33m%s\x1B[0m",
  blue: "\x1B[34m%s\x1B[0m",
  purple: "\x1B[35m%s\x1B[0m",
  teal: "\x1B[36m%s\x1B[0m",
};
type IColors = "red" | "green" | "yellow" | "blue" | "purple" | "teal";
export const colorLog = (string: string, color: IColors): void =>
  console.log(colorCodes[color], string);
