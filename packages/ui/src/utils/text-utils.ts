const abbreviations = ['aws', 'id', 'ip', 'ssl', 'url', 'fqdn'];

export const formatHeaderCell = (field: string): string => {
  const uppercased = field[0].toUpperCase() + field.slice(1);
  const spaced = uppercased.replace(/([A-Z])/g, ' $1').trim();
  return spaced
    .split(' ')
    .map((w) => (abbreviations.includes(w.toLowerCase()) ? w.toUpperCase() : w))
    .join(' ');
};

export const s = (count: number): string => (count === 1 ? '' : 's');
export const is = (count: number): string => (count === 1 ? 'is' : 'are');

export const numWithCommas = (number: number | string): string => {
  return new Intl.NumberFormat().format(Number(number));
};

export function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
