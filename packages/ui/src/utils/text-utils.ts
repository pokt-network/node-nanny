const abbreviations = ["aws", "id", "ip", "ssl", "url", "fqdn"];

export const formatHeaderCell = (field: string): string => {
  if (field === "automation") return "Automation";
  const uppercased = field[0].toUpperCase() + field.slice(1);
  const spaced = uppercased.replace(/([A-Z])/g, " $1").trim();
  return spaced
    .split(" ")
    .map((w) => (abbreviations.includes(w.toLowerCase()) ? w.toUpperCase() : w))
    .join(" ");
};

export const s = (count: number): string => (count === 1 ? "" : "s");
export const is = (count: number): string => (count === 1 ? "is" : "are");
