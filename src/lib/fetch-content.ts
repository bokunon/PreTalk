/**
 * コンテンツ取得モジュール
 * URLからHTMLを取得し、本文を抽出する
 */

import * as cheerio from "cheerio";

const MAX_CONTENT_LENGTH = 8000; // トークン制限を考慮した長さ
const REQUEST_TIMEOUT = 10000; // 10秒

/**
 * URLからHTMLを取得し、本文テキストを抽出する
 */
export async function fetchAndExtractContent(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; PreTalk/1.0; +https://github.com/bokunon/PreTalk)",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return "";
    }

    const html = await response.text();
    const text = extractText(html);
    return text.slice(0, MAX_CONTENT_LENGTH);
  } catch (error) {
    console.error(`コンテンツ取得エラー [${url}]:`, error);
    return "";
  }
}

/**
 * HTMLから本文テキストを抽出する
 */
function extractText(html: string): string {
  const $ = cheerio.load(html);

  // 不要な要素を削除
  $("script, style, nav, footer, header, aside, iframe").remove();

  // 本文候補: article, main, .content, [role="main"] など
  const selectors = [
    "article",
    "main",
    "[role='main']",
    ".content",
    ".article-body",
    ".post-content",
    "#content",
    ".entry-content",
    ".ir-content",
    "body",
  ];

  for (const selector of selectors) {
    const el = $(selector).first();
    if (el.length) {
      const text = el.text().replace(/\s+/g, " ").trim();
      if (text.length > 200) {
        return text;
      }
    }
  }

  // フォールバック: body全体
  return $("body").text().replace(/\s+/g, " ").trim();
}

/**
 * 複数URLからコンテンツを並列取得（制限付き）
 */
export async function fetchMultipleContents(
  urls: string[],
  concurrency: number = 3
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  const queue = [...urls];

  async function worker() {
    while (queue.length > 0) {
      const url = queue.shift();
      if (!url) continue;
      const content = await fetchAndExtractContent(url);
      if (content) {
        results.set(url, content);
      }
      await new Promise((r) => setTimeout(r, 300)); // 間隔を空ける
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, urls.length) }, () => worker())
  );

  return results;
}
