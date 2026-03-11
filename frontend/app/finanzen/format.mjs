export const FINANCE_CATEGORY_OPTIONS = [
  ["wohnen", "Wohnen"],
  ["versicherungen", "Versicherungen"],
  ["mobilitaet", "Mobilität"],
  ["kommunikation_medien", "Kommunikation & Medien"],
  ["familie_kind", "Familie & Kind"],
  ["finanzen", "Finanzen"],
  ["sonstiges", "Sonstiges"],
];

export const FINANCE_INTERVAL_OPTIONS = [
  ["monthly", "Monatlich"],
  ["quarterly", "Quartalsweise"],
  ["semiannual", "Halbjährlich"],
  ["annual", "Jährlich"],
  ["one_time", "Einmalig"],
];

export const FINANCE_RESPONSIBLE_OPTIONS = [
  ["dennis", "Dennis"],
  ["julia", "Julia"],
  ["gemeinsam", "Gemeinsam"],
];

export const FINANCE_ACCENT = "#b88900";
export const FINANCE_PERSON_COLORS = {
  dennis: "#2563eb",
  julia: "#db2777",
  gemeinsam: "#c2410c",
};
export const GERMAN_MONTH_NAMES = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

export function monthInputValue(dateString) {
  if (!dateString) return "";
  return String(dateString).slice(0, 7);
}

export function currentMonthValue() {
  return new Date().toISOString().slice(0, 7);
}

export function monthStartValue(monthValue) {
  if (!monthValue) return "";
  return `${String(monthValue).slice(0, 7)}-01`;
}

export function formatMonthLabel(monthValue) {
  const cleaned = String(monthValue || "").slice(0, 7);
  const [year, month] = cleaned.split("-");
  const monthIndex = Number(month) - 1;
  if (!year || Number.isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return cleaned;
  }
  return `${GERMAN_MONTH_NAMES[monthIndex]} ${year}`;
}
