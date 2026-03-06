"use client";

import { useState } from "react";

interface ResearchResult {
  companyOverview: string;
  departmentContext: string;
  estimatedChallenges: string[];
  proposalIdeas: string[];
  talkingPoints: string[];
  references: { url: string; title: string }[];
}

export default function Home() {
  const [companyName, setCompanyName] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [personName, setPersonName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          departmentName,
          personName: personName || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "リサーチに失敗しました");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <header className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">
            PreTalk
          </h1>
          <p className="mt-2 text-stone-600">
            初回商談の下調べをまとめる。会社名・部署・担当者を入力すると、話すネタを提案します。
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="company"
              className="block text-sm font-medium text-stone-700"
            >
              会社名 <span className="text-rose-500">*</span>
            </label>
            <input
              id="company"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="例: 株式会社サンプル"
              required
              className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label
              htmlFor="department"
              className="block text-sm font-medium text-stone-700"
            >
              部署名 <span className="text-rose-500">*</span>
            </label>
            <input
              id="department"
              type="text"
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
              placeholder="例: 経営企画部"
              required
              className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div>
            <label
              htmlFor="person"
              className="block text-sm font-medium text-stone-700"
            >
              担当者名（任意）
            </label>
            <input
              id="person"
              type="text"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder="例: 山田太郎"
              className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2.5 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-amber-600 px-4 py-3 font-medium text-white transition-colors hover:bg-amber-700 disabled:bg-stone-400 disabled:cursor-not-allowed"
          >
            {loading ? "リサーチ中…（1〜2分かかることがあります）" : "下調べを実行"}
          </button>
        </form>

        {error && (
          <div className="mt-8 rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-800">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-12 space-y-8">
            <section>
              <h2 className="text-lg font-semibold text-stone-900">
                会社概要
              </h2>
              <p className="mt-2 text-stone-700 leading-relaxed">
                {result.companyOverview}
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-stone-900">
                部署の文脈
              </h2>
              <p className="mt-2 text-stone-700 leading-relaxed">
                {result.departmentContext}
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-stone-900">
                課題・困りごとの推測
              </h2>
              <ul className="mt-2 list-inside list-disc space-y-1 text-stone-700">
                {result.estimatedChallenges.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-stone-900">
                提案ネタ
              </h2>
              <ul className="mt-2 list-inside list-disc space-y-1 text-stone-700">
                {result.proposalIdeas.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-stone-900">
                初回商談トピック
              </h2>
              <ul className="mt-2 list-inside list-disc space-y-1 text-stone-700">
                {result.talkingPoints.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-stone-900">
                参考リンク
              </h2>
              <ul className="mt-2 space-y-2">
                {result.references.map((r, i) => (
                  <li key={i}>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-700 hover:underline"
                    >
                      {r.title}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
