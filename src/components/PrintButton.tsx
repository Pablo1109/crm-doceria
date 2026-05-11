"use client";
import { Printer } from "lucide-react";
export default function PrintButton() { return <button type="button" onClick={() => window.print()} className="inline-flex items-center rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm"><Printer className="mr-2 h-4 w-4" /> Imprimir</button>; }
