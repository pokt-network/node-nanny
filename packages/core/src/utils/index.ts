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
