import { getFlagUrl, getCountryName } from "@/constants/countries";

interface CountryFlagProps {
  code: string | null | undefined;
  size?: number;
  showName?: boolean;
  className?: string;
}

export function CountryFlag({ code, size = 20, showName = false, className = "" }: CountryFlagProps) {
  if (!code) return null;

  return (
    <span className={`inline-flex items-center gap-1 ${className}`} data-testid={`flag-${code}`}>
      <img
        src={getFlagUrl(code, size)}
        alt={getCountryName(code)}
        className="inline-block rounded-sm"
        style={{ width: size, height: Math.round(size * 0.75) }}
        loading="lazy"
      />
      {showName && <span>{getCountryName(code)}</span>}
    </span>
  );
}
