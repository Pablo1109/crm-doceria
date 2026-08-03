"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { LockKeyhole, Loader2, Mail, User, ShieldCheck } from "lucide-react";

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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#ffe4ef,transparent_35%),linear-gradient(135deg,#fffbf9,#fff8ef_50%,#fff)] flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 relative h-20 w-20 overflow-hidden rounded-full bg-white ring-2 ring-[#ead8cf] shadow-md">
            <Image src="/logo.png" alt="La Délice" fill className="object-cover" priority />
          </div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[#c98b9b]">Doces Gourmet da Ana</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-[#5b382d]">
            {isRegistering ? "Criar nova conta" : "Acesso ao CRM"}
          </h1>
          <p className="mt-2 text-sm text-[#8b6a5d] font-bold">
            Gestão profissional de encomendas, receitas, estoque e financeiro.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-[2.5rem] border border-[#ead8cf] bg-white/80 p-8 shadow-xl shadow-[#f0ded6]/50 backdrop-blur transition-all">
          
          {isRegistering && (
            <div className="mb-4">
              <label className="text-[10px] font-black uppercase tracking-wider text-[#9a6d5c]">Nome completo</label>
              <div className="mt-1.5 flex items-center rounded-2xl border border-[#ead8cf] bg-[#fff8ef]/20 px-4 py-3 focus-within:border-[#c98b9b] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#fff1f4] transition">
                <User className="mr-3 h-5 w-5 text-[#8b6a5d]" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full bg-transparent text-[#5b382d] font-semibold outline-none placeholder:text-[#9a6d5c]/60 text-sm"
                  required
                />
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className="text-[10px] font-black uppercase tracking-wider text-[#9a6d5c]">E-mail de acesso</label>
            <div className="mt-1.5 flex items-center rounded-2xl border border-[#ead8cf] bg-[#fff8ef]/20 px-4 py-3 focus-within:border-[#c98b9b] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#fff1f4] transition">
              <Mail className="mr-3 h-5 w-5 text-[#8b6a5d]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@doceria.com"
                className="w-full bg-transparent text-[#5b382d] font-semibold outline-none placeholder:text-[#9a6d5c]/60 text-sm"
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="text-[10px] font-black uppercase tracking-wider text-[#9a6d5c]">Senha</label>
            <div className="mt-1.5 flex items-center rounded-2xl border border-[#ead8cf] bg-[#fff8ef]/20 px-4 py-3 focus-within:border-[#c98b9b] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#fff1f4] transition">
              <LockKeyhole className="mr-3 h-5 w-5 text-[#8b6a5d]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isRegistering ? "Crie uma senha forte" : "Sua senha pessoal"}
                className="w-full bg-transparent text-[#5b382d] font-semibold outline-none placeholder:text-[#9a6d5c]/60 text-sm"
                required
              />
            </div>
          </div>

          {isRegistering && (
            <div className="mb-4">
              <label className="text-[10px] font-black uppercase tracking-wider text-[#9a6d5c] flex items-center gap-1">
                Código de acesso da loja 
                <span className="text-[10px] text-[#c98b9b] normal-case font-bold">(Padrão: 123456)</span>
              </label>
              <div className="mt-1.5 flex items-center rounded-2xl border border-[#ead8cf] bg-[#fff8ef]/20 px-4 py-3 focus-within:border-[#c98b9b] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#fff1f4] transition">
                <ShieldCheck className="mr-3 h-5 w-5 text-[#8b6a5d]" />
                <input
                  type="password"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Código master para autorização"
                  className="w-full bg-transparent text-[#5b382d] font-semibold outline-none placeholder:text-[#9a6d5c]/60 text-sm"
                  required
                />
              </div>
            </div>
          )}

          {error && (
            <p className="mt-3 rounded-2xl bg-rose-50 border border-rose-100 px-4 py-3 text-xs font-bold text-rose-600 transition-all animate-pulse">
              {error}
            </p>
          )}

          {success && (
            <p className="mt-3 rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-xs font-bold text-emerald-600 transition-all">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center rounded-2xl bg-[#5b382d] hover:bg-[#c98b9b] px-5 py-3.5 font-black text-white shadow-md transition hover:-translate-y-0.5 disabled:opacity-60 cursor-pointer"
          >
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
            {isRegistering ? "Criar conta e entrar" : "Entrar no painel"}
          </button>

          <div className="mt-6 border-t border-[#ead8cf]/40 pt-5 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError("");
                setSuccess("");
              }}
              className="text-sm font-black text-[#5b382d] hover:text-[#c98b9b] cursor-pointer transition"
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
