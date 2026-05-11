import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arena Next.js PostgreSQL Starter",
  description: "Starter template with Next.js, Drizzle, and PostgreSQL.",
};

import Link from "next/link";
import { LayoutDashboard, ShoppingCart, Utensils, Package } from "lucide-react";
import MobileNav from "@/components/MobileNav";

export default function RootLayout({ children }: { children: ReactNode }) {
  const menuItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard, iconName: "LayoutDashboard" },
    { name: "Pedidos", href: "/pedidos", icon: ShoppingCart, iconName: "ShoppingCart" },
    { name: "Receitas", href: "/receitas", icon: Utensils, iconName: "Utensils" },
    { name: "Ingredientes", href: "/ingredientes", icon: Package, iconName: "Package" },
  ];

  return (
    <html lang="pt-br">
      <body className="bg-slate-100 text-slate-900 antialiased">
        <div className="flex h-screen bg-gray-50 overflow-hidden">
          {/* Sidebar for Desktop */}
          <aside className="w-64 bg-white border-r hidden md:flex flex-col">
            <div className="p-6">
              <h1 className="text-2xl font-bold text-pink-600">Doceria CRM</h1>
              <p className="text-xs text-gray-400 mt-1">Gestão da Doce Startup</p>
            </div>
            <nav className="mt-6 flex-1">
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center px-6 py-4 text-gray-600 hover:bg-pink-50 hover:text-pink-600 transition-all border-l-4 border-transparent hover:border-pink-600"
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t text-[10px] text-gray-400 text-center">
              Desenvolvido para sua Esposa ❤️
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0">
            <MobileNav menuItems={menuItems.map(m => ({ name: m.name, href: m.href, iconName: m.iconName }))} />

            <main className="flex-1 overflow-auto p-4 md:p-8">
              <div className="max-w-7xl mx-auto">
                {children}
              </div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
