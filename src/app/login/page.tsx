"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Loader2, Sparkles } from "lucide-react";
export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const response = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    setLoading(false);
    if (!response.ok) { setError("Senha incorreta. Confira a senha cadastrada na Vercel."); return; }
    const next = new URLSearchParams(window.location.search).get("next") || "/";
    router.push(next); router.refresh();
  }
  return <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#ffe4ef,transparent_32%),linear-gradient(135deg,#fff7fb,#f8fafc_50%,#fff)] flex items-center justify-center p-6"><div className="w-full max-w-md"><div className="mb-8 text-center"><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-white shadow-sm ring-1 ring-rose-100"><Sparkles className="h-7 w-7 text-rose-500" /></div><p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-400">Doces Gourmet da Ana</p><h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Acesse seu painel</h1><p className="mt-2 text-sm text-slate-500">Gestão de encomendas, receitas, estoque e financeiro.</p></div><form onSubmit={handleSubmit} className="rounded-[2rem] border border-white/70 bg-white/85 p-7 shadow-2xl shadow-rose-100/70 backdrop-blur"><label className="text-sm font-bold text-slate-700">Senha do sistema</label><div className="mt-2 flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 focus-within:border-rose-400 focus-within:ring-4 focus-within:ring-rose-100"><LockKeyhole className="mr-3 h-5 w-5 text-slate-400" /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Digite sua senha" className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400" autoFocus required /></div>{error && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>}<button type="submit" disabled={loading} className="mt-5 flex w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-3.5 font-bold text-white shadow-lg shadow-slate-200 transition hover:-translate-y-0.5 hover:bg-rose-600 disabled:opacity-60">{loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}Entrar no painel</button><p className="mt-5 text-center text-xs text-slate-400">Senha configurada em MASTER_PASSWORD na Vercel.</p></form></div></main>;
}
