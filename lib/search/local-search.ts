export function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getSearchTokenVariants(token: string) {
  const variants = new Set<string>();

  variants.add(token);

  if (token.length > 3 && token.endsWith("s")) {
    variants.add(token.slice(0, -1));
  }

  if (token.length > 4 && token.endsWith("es")) {
    variants.add(token.slice(0, -2));
  }

  if (token.length > 3) {
    variants.add(`${token}s`);
  }

  if (token.length > 4 && !token.endsWith("s")) {
    variants.add(`${token}es`);
  }

  return Array.from(variants).filter((variant) => variant.length >= 3);
}

export function textMatchesSearch(searchableText: string, query: string) {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return true;
  }

  const normalizedSearchableText = normalizeSearchText(searchableText);
  const tokens = normalizedQuery
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);

  if (tokens.length === 0) {
    return true;
  }

  return tokens.every((token) =>
    getSearchTokenVariants(token).some((variant) =>
      normalizedSearchableText.includes(variant),
    ),
  );
}
