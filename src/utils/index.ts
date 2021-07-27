export const wait = async (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

export const hexToDec = (hexString) => {
  return parseInt(hexString, 16);
};
