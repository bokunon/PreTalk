/**
 * AI分析・統合モジュール
 * 収集した情報をLLMで分析し、初回商談トピックを生成する
 */

import OpenAI from "openai";

export interface ResearchResult {
  companyOverview: string;
  departmentContext: string;
  estimatedChallenges: string[];
  proposalIdeas: string[];
  talkingPoints: string[];
  references: { url: string; title: string }[];
}

function buildPrompt(
  input: { companyName: string; departmentName: string; personName?: string },
  searchResults: { title: string; href: string; body: string }[],
  contents: Map<string, string>
): string {
  const refs = searchResults.map((r) => ({
    url: r.href,
    title: r.title,
    snippet: r.body,
    fullContent: contents.get(r.href) || "",
  }));

  const refsText = refs
    .map(
      (r) =>
        `## ${r.title}\nURL: ${r.url}\nスニペット: ${r.snippet}\n${r.fullContent ? `本文（抜粋）: ${r.fullContent.slice(0, 2000)}...` : ""}`
    )
    .join("\n\n---\n\n");

  return `あなたは営業・商談のプロです。初回商談の下調べをまとめるアシスタントとして、以下の情報を分析してください。

## 入力
- 会社名: ${input.companyName}
- 部署名: ${input.departmentName}
${input.personName ? `- 担当者名: ${input.personName}` : ""}

## 収集した情報
${refsText}

## 出力形式（JSON）
以下のJSON形式で回答してください。他のテキストは含めないでください。

{
  "companyOverview": "会社の概要（事業内容、理念・ビジョン、中期経営計画の要約を200字程度で）",
  "departmentContext": "当該部署の文脈（役割、最近の動き、インタビュー等からの情報を200字程度で）",
  "estimatedChallenges": ["課題・困りごとの推測1", "課題・困りごとの推測2", "..."],
  "proposalIdeas": ["提案ネタ1（初回で持っていくと良さそうな話題）", "提案ネタ2", "..."],
  "talkingPoints": ["初回商談で話すトピック1", "トピック2", "トピック3", "..."]
}

情報が不足している場合は推測で補い、初回商談で使える実践的な内容にしてください。`;
}

export async function analyze(
  input: { companyName: string; departmentName: string; personName?: string },
  searchResults: { title: string; href: string; body: string }[],
  contents: Map<string, string>
): Promise<ResearchResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY が設定されていません");
  }

  const openai = new OpenAI({ apiKey });
  const prompt = buildPrompt(input, searchResults, contents);

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "あなたは営業の下調べを支援するアシスタントです。JSON形式のみで回答してください。",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content?.trim() || "{}";

  // JSONを抽出（```json ... ``` で囲まれている場合に対応）
  let jsonStr = content;
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(jsonStr) as ResearchResult;
    parsed.references = searchResults.slice(0, 15).map((r) => ({
      url: r.href,
      title: r.title,
    }));
    return parsed;
  } catch (e) {
    console.error("JSON パースエラー:", content);
    throw new Error("AIの応答を解析できませんでした");
  }
}
