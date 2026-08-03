"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Loader2, Sparkles, Mail, User, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const url = isRegistering ? "/api/register" : "/api/login";
    const body = isRegistering 
      ? { name, email, password, inviteCode }
      : { email, password };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      setLoading(false);

      if (!response.ok) {
        setError(data.error || "Algo deu errado. Tente novamente.");
        return;
      }

      if (isRegistering) {
        setSuccess("Conta criada com sucesso! Redirecionando...");
        setTimeout(() => {
          const next = new URLSearchParams(window.location.search).get("next") || "/";
          router.push(next);
          router.refresh();
        }, 1500);
      } else {
        const next = new URLSearchParams(window.location.search).get("next") || "/";
        router.push(next);
        router.refresh();
      }
    } catch (err) {
      setLoading(false);
      setError("Erro de rede. Verifique se o servidor de banco de dados está ativo.");
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#ffe4ef,transparent_32%),linear-gradient(135deg,#fff7fb,#f8fafc_50%,#fff)] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-white shadow-sm ring-1 ring-rose-100">
            <Sparkles className="h-7 w-7 text-rose-500 animate-pulse" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-400">Doces Gourmet da Ana</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            {isRegistering ? "Criar nova conta" : "Acesse seu painel"}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Gestão compartilhada de encomendas, receitas, estoque e financeiro.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-[2.2rem] border border-white/70 bg-white/85 p-8 shadow-2xl shadow-rose-100/70 backdrop-blur transition-all">
          
          {isRegistering && (
            <div className="mb-4">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Nome completo</label>
              <div className="mt-1.5 flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 focus-within:border-rose-400 focus-within:ring-4 focus-within:ring-rose-100">
                <User className="mr-3 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400 text-sm"
                  required
                />
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">E-mail de acesso</label>
            <div className="mt-1.5 flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 focus-within:border-rose-400 focus-within:ring-4 focus-within:ring-rose-100">
              <Mail className="mr-3 h-5 w-5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@doceria.com"
                className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400 text-sm"
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Senha</label>
            <div className="mt-1.5 flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 focus-within:border-rose-400 focus-within:ring-4 focus-within:ring-rose-100">
              <LockKeyhole className="mr-3 h-5 w-5 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isRegistering ? "Crie uma senha forte" : "Sua senha"}
                className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400 text-sm"
                required
              />
            </div>
          </div>

          {isRegistering && (
            <div className="mb-4">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                Código de acesso da loja 
                <span className="text-[10px] text-rose-400 normal-case">(Padrão: 123456)</span>
              </label>
              <div className="mt-1.5 flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 focus-within:border-rose-400 focus-within:ring-4 focus-within:ring-rose-100">
                <ShieldCheck className="mr-3 h-5 w-5 text-slate-400" />
                <input
                  type="password"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Código master para autorização"
                  className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400 text-sm"
                  required
                />
              </div>
            </div>
          )}

          {error && (
            <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 transition-all">
              {error}
            </p>
          )}

          {success && (
            <p className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-600 transition-all">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center rounded-2xl bg-slate-950 px-5 py-3.5 font-bold text-white shadow-lg shadow-slate-200 transition hover:-translate-y-0.5 hover:bg-rose-600 disabled:opacity-60 cursor-pointer"
          >
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
            {isRegistering ? "Criar conta e entrar" : "Entrar no painel"}
          </button>

          <div className="mt-6 border-t border-slate-100 pt-5 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError("");
                setSuccess("");
              }}
              className="text-sm font-bold text-rose-500 hover:text-rose-600 cursor-pointer"
            >
              {isRegistering 
                ? "Já tem uma conta cadastrada? Faça login" 
                : "Novo na doceria? Cadastre seu usuário"
              }
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
