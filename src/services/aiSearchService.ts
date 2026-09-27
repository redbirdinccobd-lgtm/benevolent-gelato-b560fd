
export interface ParsedSearchQuery {
  brand?: string[];
  category?: string[];
  garmentType?: string[];
  colors?: string[];
  sizes?: string[];
}

export const parseNaturalLanguageSearch = async (query: string): Promise<ParsedSearchQuery> => {
  if (!query.trim()) return {};

  try {
    const res = await fetch('/api/ai/parse-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const data = await res.json();
    return data as ParsedSearchQuery;
  } catch (error) {
    console.error("AI Search Parsing Error:", error);
    return {};
  }
};
