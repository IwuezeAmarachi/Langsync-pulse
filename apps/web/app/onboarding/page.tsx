"use client";

import { useState, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

type Step = "brand" | "prompts" | "competitors";
const STEPS: Step[] = ["brand", "prompts", "competitors"];

export default function OnboardingPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const [step, setStep] = useState<Step>("brand");
  const [saving, setSaving] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  const [brandName, setBrandName] = useState("");
  const [website, setWebsite] = useState("");

  const [promptInput, setPromptInput] = useState("");
  const [prompts, setPrompts] = useState<string[]>([]);

  const [competitorInput, setCompetitorInput] = useState("");
  const [competitors, setCompetitors] = useState<string[]>([]);

  const stepIndex = STEPS.indexOf(step);

  function addPrompt() {
    const val = promptInput.trim();
    if (val && !prompts.includes(val)) setPrompts((p) => [...p, val]);
    setPromptInput("");
  }

  function addCompetitor() {
    const val = competitorInput.trim();
    if (val && !competitors.includes(val)) setCompetitors((c) => [...c, val]);
    setCompetitorInput("");
  }

  async function handleBrandNext(e: React.FormEvent) {
    e.preventDefault();
    if (!brandName.trim()) return;
    setSaving(true);
    try {
      const wsRes = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: brandName.trim() }),
      });
      const ws = await wsRes.json();
      setWorkspaceId(ws.id);
      await fetch(`/api/workspaces/${ws.id}/brand`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: brandName.trim(), primaryDomain: website.trim() || null }),
      });
      setStep("prompts");
    } finally {
      setSaving(false);
    }
  }

  async function handlePromptsNext(e: React.FormEvent) {
    e.preventDefault();
    const all = promptInput.trim() ? [...prompts, promptInput.trim()] : prompts;
    if (!all.length) { setStep("competitors"); return; }
    setSaving(true);
    try {
      await Promise.all(all.map((p) =>
        fetch(`/api/workspaces/${workspaceId}/prompts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ promptText: p }),
        })
      ));
      setStep("competitors");
    } finally {
      setSaving(false);
    }
  }

  async function handleFinish(e: React.FormEvent) {
    e.preventDefault();
    const all = competitorInput.trim() ? [...competitors, competitorInput.trim()] : competitors;
    setSaving(true);
    try {
      if (all.length) {
        await Promise.all(all.map((c) =>
          fetch(`/api/workspaces/${workspaceId}/competitors`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: c }),
          })
        ));
      }
    } finally {
      setSaving(false);
    }
    qc.invalidateQueries({ queryKey: ["workspaces"] });
    router.push("/dashboard");
  }

  const stepMeta = [
    { label: "Brand", icon: "🏢" },
    { label: "Prompts", icon: "💬" },
    { label: "Competitors", icon: "🎯" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center px-4 py-16">
      {/* Logo */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
            <span className="text-white text-xs font-bold">LP</span>
          </div>
          <span className="font-semibold text-lg tracking-tight">LangSync Pulse</span>
        </div>
        <p className="text-slate-500 text-sm">Let's get you set up in 2 minutes</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {stepMeta.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              i === stepIndex
                ? "bg-black text-white shadow-sm"
                : i < stepIndex
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-200 text-slate-400"
            }`}>
              <span>{i < stepIndex ? "✓" : s.icon}</span>
              <span>{s.label}</span>
            </div>
            {i < stepMeta.length - 1 && (
              <div className={`w-6 h-px ${i < stepIndex ? "bg-emerald-300" : "bg-slate-200"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 w-full max-w-[480px] overflow-hidden">

        {/* Step 1 — Brand */}
        {step === "brand" && (
          <form onSubmit={handleBrandNext}>
            <div className="px-8 pt-8 pb-6">
              <h2 className="text-xl font-bold text-slate-900 mb-1">Your brand</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                We'll track every time AI mentions you — or doesn't — when answering questions in your space.
              </p>
            </div>
            <div className="px-8 pb-8 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Brand / company name <span className="text-red-400">*</span>
                </label>
                <input
                  autoFocus
                  required
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-black/10 focus:border-slate-400 transition"
                  placeholder="e.g. Acme Corp"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Website URL <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-black/10 focus:border-slate-400 transition"
                  placeholder="e.g. acmecorp.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
                <p className="text-xs text-slate-400 mt-1.5">Helps us match citations that link back to you</p>
              </div>
              <button
                type="submit"
                disabled={saving || !brandName.trim()}
                className="w-full mt-2 py-2.5 bg-black text-white text-sm font-semibold rounded-xl hover:bg-slate-800 disabled:opacity-40 transition"
              >
                {saving ? "Saving…" : "Continue →"}
              </button>
            </div>
          </form>
        )}

        {/* Step 2 — Prompts */}
        {step === "prompts" && (
          <form onSubmit={handlePromptsNext}>
            <div className="px-8 pt-8 pb-6">
              <h2 className="text-xl font-bold text-slate-900 mb-1">Prompts to monitor</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                What questions do people ask AI when looking for something like you? You'll capture AI responses to these using the extension.
              </p>
            </div>
            <div className="px-8 pb-8 space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Add a prompt</label>
                <div className="flex gap-2">
                  <input
                    autoFocus
                    className="flex-1 px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-black/10 focus:border-slate-400 transition"
                    placeholder='e.g. "best CRM for B2B startups"'
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === "Enter") { e.preventDefault(); addPrompt(); }
                    }}
                  />
                  <button
                    type="button"
                    onClick={addPrompt}
                    className="px-4 py-2.5 text-sm font-medium bg-slate-100 hover:bg-slate-200 rounded-xl transition text-slate-700"
                  >
                    Add
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1.5">Press Enter or click Add. You can add more later.</p>
              </div>

              {prompts.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {prompts.map((p) => (
                    <div key={p} className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5">
                      <span className="flex-1 text-sm text-slate-700 truncate">{p}</span>
                      <button
                        type="button"
                        onClick={() => setPrompts((arr) => arr.filter((x) => x !== p))}
                        className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep("competitors")}
                  className="px-4 py-2.5 text-sm text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
                >
                  Skip
                </button>
                <button
                  type="submit"
                  disabled={saving || (prompts.length === 0 && !promptInput.trim())}
                  className="flex-1 py-2.5 bg-black text-white text-sm font-semibold rounded-xl hover:bg-slate-800 disabled:opacity-40 transition"
                >
                  {saving ? "Saving…" : "Continue →"}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Step 3 — Competitors */}
        {step === "competitors" && (
          <form onSubmit={handleFinish}>
            <div className="px-8 pt-8 pb-6">
              <h2 className="text-xl font-bold text-slate-900 mb-1">Your competitors</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                We'll flag every time AI recommends a competitor instead of you, so you know exactly where you're losing visibility.
              </p>
            </div>
            <div className="px-8 pb-8 space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Add a competitor</label>
                <div className="flex gap-2">
                  <input
                    autoFocus
                    className="flex-1 px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-black/10 focus:border-slate-400 transition"
                    placeholder="e.g. HubSpot"
                    value={competitorInput}
                    onChange={(e) => setCompetitorInput(e.target.value)}
                    onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === "Enter") { e.preventDefault(); addCompetitor(); }
                    }}
                  />
                  <button
                    type="button"
                    onClick={addCompetitor}
                    className="px-4 py-2.5 text-sm font-medium bg-slate-100 hover:bg-slate-200 rounded-xl transition text-slate-700"
                  >
                    Add
                  </button>
                </div>
              </div>

              {competitors.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {competitors.map((c) => (
                    <div key={c} className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5">
                      <span className="flex-1 text-sm text-slate-700">{c}</span>
                      <button
                        type="button"
                        onClick={() => setCompetitors((arr) => arr.filter((x) => x !== c))}
                        className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    qc.invalidateQueries({ queryKey: ["workspaces"] });
                    router.push("/dashboard");
                  }}
                  className="px-4 py-2.5 text-sm text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
                >
                  Skip
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-black text-white text-sm font-semibold rounded-xl hover:bg-slate-800 disabled:opacity-40 transition"
                >
                  {saving ? "Saving…" : "Go to dashboard →"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      <p className="mt-6 text-xs text-slate-400">You can update all of this later from your dashboard settings.</p>
    </div>
  );
}
