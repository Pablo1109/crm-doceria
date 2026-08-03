"use client";
import Link from "next/link";
import { useState, type ElementType } from "react";
import { Calendar, CalendarDays, ChefHat, ClipboardList, Home, Menu, Package, Sparkles, WalletCards, X, Boxes } from "lucide-react";
const icons: Record<string, ElementType> = { Home, ClipboardList, ChefHat, Package, CalendarDays, WalletCards, Calendar, Boxes };
export default function MobileNav({ menuItems }: { menuItems: { name: string; href: string; iconName: string }[] }) {
  const [open, setOpen] = useState(false);
  return <header className="sticky top-0 z-40 border-b border-rose-100 bg-white/90 px-4 py-3 backdrop-blur md:hidden"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-500"><Sparkles className="h-5 w-5" /></div><div><p className="text-sm font-black text-slate-950">Doces Gourmet</p><p className="text-[11px] text-slate-400">da Ana</p></div></div><button onClick={() => setOpen((v) => !v)} className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-600">{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button></div>{open && <nav className="mt-3 grid grid-cols-2 gap-2 rounded-3xl border border-rose-100 bg-white p-3 shadow-xl shadow-rose-100/60">{menuItems.map((item) => { const Icon = icons[item.iconName] || Home; return <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-3 text-sm font-bold text-slate-600"><Icon className="h-4 w-4 text-rose-500" />{item.name}</Link>; })}</nav>}</header>;
}

