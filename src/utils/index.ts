export const wait = async (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

export const hexToDec = (hexString) => {
  return parseInt(hexString, 16);
};

export const compare = (a, b, field) => {
  const A = a[field].toUpperCase();
  const B = b[field].toUpperCase();
  let comparison = 0;
  if (A > B) {
    comparison = 1;
  } else if (A < B) {
    comparison = -1;
  }
  return comparison;
}