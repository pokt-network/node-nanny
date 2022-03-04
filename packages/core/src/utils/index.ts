export const wait = async (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

export const hexToDec = (resultString: number | string): number => {
  return typeof resultString === "number" ? resultString : parseInt(resultString, 16);
};
