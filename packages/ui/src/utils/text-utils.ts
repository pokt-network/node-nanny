const TEST = "AwsInstanceId";

const abbreviations = ["aws", "id"];

export const formatHeaderCell = (field: string): string => {
  const uppercased = field[0].toUpperCase() + field.slice(1);
  const spaced = uppercased.replace(/([A-Z])/g, " $1").trim();
  return spaced
    .split(" ")
    .map((w) => (abbreviations.includes(w.toLowerCase()) ? w.toUpperCase() : w))
    .join(" ");
};
