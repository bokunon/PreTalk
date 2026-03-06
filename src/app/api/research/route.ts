/**
 * リサーチ実行API
 * POST: 会社名・部署名・担当者名を受け取り、初回商談トピックを返す
 */

import { NextResponse } from "next/server";
import { search } from "@/lib/search";
import { fetchMultipleContents } from "@/lib/fetch-content";
import { analyze } from "@/lib/analyze";

export const maxDuration = 60; // Vercel Pro では60秒まで

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyName, departmentName, personName } = body;

    if (!companyName || !departmentName) {
      return NextResponse.json(
        { error: "会社名と部署名は必須です" },
        { status: 400 }
      );
    }

    const input = {
      companyName: String(companyName).trim(),
      departmentName: String(departmentName).trim(),
      personName: personName ? String(personName).trim() : undefined,
    };

    // Phase 1-2: 検索
    const { results: searchResults } = await search(input);

    if (searchResults.length === 0) {
      return NextResponse.json({
        error: "検索結果がありませんでした。別のキーワードでお試しください。",
      });
    }

    // Phase 3: コンテンツ取得（上位10件程度）
    const urlsToFetch = searchResults.slice(0, 10).map((r) => r.href);
    const contents = await fetchMultipleContents(urlsToFetch);

    // Phase 4: AI分析
    const analysis = await analyze(input, searchResults, contents);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("リサーチエラー:", error);
    const message =
      error instanceof Error ? error.message : "不明なエラーが発生しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
