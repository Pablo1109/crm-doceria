import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, ChefHat, ClipboardList, Home, Package, WalletCards, Boxes, LogOut } from "lucide-react";
import MobileNav from "@/components/MobileNav";
import { getCurrentUser } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "La Délice | Doces Gourmet",
  description: "Sistema de encomendas, receitas, estoque e financeiro.",
};

const menuItems = [
  { name: "Dashboard", href: "/", icon: Home, iconName: "Home" },
  { name: "Pedidos", href: "/pedidos", icon: ClipboardList, iconName: "ClipboardList" },
  { name: "Calendário", href: "/calendario", icon: Calendar, iconName: "Calendar" },
  { name: "Receitas", href: "/receitas", icon: ChefHat, iconName: "ChefHat" },
  { name: "Ingredientes", href: "/ingredientes", icon: Package, iconName: "Package" },
  { name: "Estoque", href: "/estoque", icon: Boxes, iconName: "Boxes" },
  { name: "Financeiro", href: "/financeiro", icon: WalletCards, iconName: "WalletCards" },
];

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  const userName = user ? user.name : "Painel da Ana";

  async function handleLogout() {
    "use server";
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    cookieStore.delete("auth_token");
    const { redirect } = await import("next/navigation");
    redirect("/login");
  }

  if (!user) {
    return (
      <html lang="pt-br">
        <body className="bg-[#fff8ef] text-slate-900 antialiased">
          {children}
        </body>
      </html>
    );
  }

  return (
    <html lang="pt-br">
      <body className="bg-[#fff8ef] text-slate-900 antialiased">
        <div className="flex min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#ffe8ef,transparent_30%),linear-gradient(180deg,#fffdf9,#fff8ef)]">
          <aside className="hidden w-72 shrink-0 border-r border-[#ead8cf] bg-white/82 backdrop-blur-xl md:flex md:flex-col">
            <div className="p-7">
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 overflow-hidden rounded-full bg-white ring-1 ring-[#ead8cf]">
                  <Image src="/logo.png" alt="La Délice" fill className="object-cover" priority />
                </div>
                <div>
                  <h1 className="text-lg font-black tracking-tight text-[#5b382d]">La Délice</h1>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9a6d5c]">Doces Gourmet</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 space-y-1 px-4">
              {menuItems.map((item) => (
                <Link key={item.name} href={item.href} className="group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-[#8b6a5d] transition hover:bg-[#fff1f4] hover:text-[#5b382d]">
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              ))}
            </nav>

            <div className="m-4 rounded-3xl border border-[#ead8cf] bg-[#fff8ef] p-4">
              <p className="text-sm font-black text-[#5b382d]">Olá, {userName}!</p>
              <p className="mt-1 text-[10px] uppercase font-bold tracking-widest text-[#9a6d5c]">La Délice Doceria</p>
              <p className="mt-2 text-xs leading-5 text-[#8b6a5d]">Encomendas, receitas e estoque com baixa automática ao concluir o pedido.</p>
              {user && (
                <form action={handleLogout} className="mt-3">
                  <button type="submit" className="w-full text-left text-xs font-bold text-red-500 hover:text-red-700 transition flex items-center gap-1.5 cursor-pointer">
                    <LogOut className="h-3.5 w-3.5" />
                    Sair da conta
                  </button>
                </form>
              )}
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <MobileNav menuItems={menuItems.map(({ name, href, iconName }) => ({ name, href, iconName }))} />
            <main className="flex-1 overflow-auto p-4 md:p-8">
              <div className="mx-auto max-w-7xl">{children}</div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
