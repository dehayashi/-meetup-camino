export interface Country {
  code: string;
  name: string;
}

export const countries: Country[] = [
  { code: "ar", name: "Argentina" },
  { code: "au", name: "Australia" },
  { code: "at", name: "Austria" },
  { code: "be", name: "Belgium" },
  { code: "bo", name: "Bolivia" },
  { code: "br", name: "Brasil" },
  { code: "ca", name: "Canada" },
  { code: "cl", name: "Chile" },
  { code: "cn", name: "China" },
  { code: "co", name: "Colombia" },
  { code: "cr", name: "Costa Rica" },
  { code: "hr", name: "Croatia" },
  { code: "cz", name: "Czechia" },
  { code: "dk", name: "Denmark" },
  { code: "ec", name: "Ecuador" },
  { code: "fi", name: "Finland" },
  { code: "fr", name: "France" },
  { code: "de", name: "Deutschland" },
  { code: "gr", name: "Greece" },
  { code: "gt", name: "Guatemala" },
  { code: "hu", name: "Hungary" },
  { code: "in", name: "India" },
  { code: "ie", name: "Ireland" },
  { code: "il", name: "Israel" },
  { code: "it", name: "Italia" },
  { code: "jp", name: "Japan" },
  { code: "kr", name: "South Korea" },
  { code: "mx", name: "Mexico" },
  { code: "nl", name: "Netherlands" },
  { code: "nz", name: "New Zealand" },
  { code: "no", name: "Norway" },
  { code: "pa", name: "Panama" },
  { code: "py", name: "Paraguay" },
  { code: "pe", name: "Peru" },
  { code: "ph", name: "Philippines" },
  { code: "pl", name: "Poland" },
  { code: "pt", name: "Portugal" },
  { code: "ro", name: "Romania" },
  { code: "ru", name: "Russia" },
  { code: "za", name: "South Africa" },
  { code: "es", name: "Espa\u00f1a" },
  { code: "se", name: "Sweden" },
  { code: "ch", name: "Switzerland" },
  { code: "tw", name: "Taiwan" },
  { code: "th", name: "Thailand" },
  { code: "tr", name: "Turkey" },
  { code: "ua", name: "Ukraine" },
  { code: "gb", name: "United Kingdom" },
  { code: "us", name: "United States" },
  { code: "uy", name: "Uruguay" },
  { code: "ve", name: "Venezuela" },
  { code: "vn", name: "Vietnam" },
];

export function getFlagUrl(countryCode: string, size: number = 20): string {
  return `https://flagcdn.com/w${size}/${countryCode.toLowerCase()}.png`;
}

export function getCountryName(code: string): string {
  return countries.find(c => c.code === code)?.name || code.toUpperCase();
}
