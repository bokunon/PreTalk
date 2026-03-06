/**
 * Web検索モジュール
 * 会社名・部署名・担当者名から検索クエリを生成し、DuckDuckGoで検索する
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const duckduckgoSearch = require("duckduckgo-search");

export interface SearchResult {
  title: string;
  href: string;
  body: string;
}

export interface ResearchInput {
  companyName: string;
  departmentName: string;
  personName?: string;
}

/**
 * 検索クエリを生成する
 */
function buildSearchQueries(input: ResearchInput): string[] {
  const { companyName, departmentName, personName } = input;
  const queries: string[] = [
    `${companyName} IR 投資家情報`,
    `${companyName} 理念 ビジョン 経営方針`,
    `${companyName} 中期経営計画`,
    `${companyName} ${departmentName} インタビュー`,
    `${companyName} ${departmentName} ニュース`,
  ];

  if (personName) {
    queries.push(`${companyName} ${personName} インタビュー`);
    queries.push(`${personName} ${departmentName}`);
  }

  return queries;
}

/**
 * 単一クエリで検索し、上位N件を返す
 */
async function searchQuery(
  query: string,
  maxResults: number = 5
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  try {
    for await (const result of duckduckgoSearch.text(query)) {
      results.push({
        title: result.title,
        href: result.href,
        body: result.body,
      });
      if (results.length >= maxResults) break;
    }
  } catch (error) {
    console.error(`検索エラー [${query}]:`, error);
  }
  return results;
}

/**
 * 全クエリで検索し、重複を除いた結果を返す
 */
export async function search(input: ResearchInput): Promise<{
  results: SearchResult[];
  queries: string[];
}> {
  const queries = buildSearchQueries(input);
  const seenUrls = new Set<string>();
  const allResults: SearchResult[] = [];

  for (const query of queries) {
    const results = await searchQuery(query, 5);
    for (const r of results) {
      if (!seenUrls.has(r.href)) {
        seenUrls.add(r.href);
        allResults.push(r);
      }
    }
    // レート制限対策
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return { results: allResults, queries };
}
