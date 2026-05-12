import { db } from "@/db";
import { orderItems, orders, recipes } from "@/db/schema";
import { longDate, money, numberValue } from "@/lib/format";
import { eq } from "drizzle-orm";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import PrintButton from "@/components/PrintButton";
import Toast from "@/components/Toast";

export default async function PedidoDetalhePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams?: Promise<{ success?: string }> }) {
 const { id } = await params;
 const sp = await searchParams;
 const orderId=Number(id);
 const order=await db.query.orders.findFirst({where:eq(orders.id,orderId)});
 if(!order) notFound();
 const items=await db.select({quantity:orderItems.quantity, unitPrice:orderItems.unitPrice, recipeName:recipes.name}).from(orderItems).innerJoin(recipes,eq(orderItems.recipeId,recipes.id)).where(eq(orderItems.orderId,orderId));
 const phone=order.customerPhone?.replace(/\D/g,"")||"";
 const message=encodeURIComponent(`Olá ${order.customerName}! Segue o orçamento da La Délice - Doces Gourmet:\n\n${items.map(i=>`• ${i.quantity}x ${i.recipeName}: ${money(numberValue(i.unitPrice)*i.quantity)}`).join("\n")}\n\nTotal: ${money(order.totalAmount)}\nData combinada: ${longDate(order.deliveryDate)}\n\nQualquer ajuste é só me chamar.`);
 return <div className="mx-auto max-w-4xl space-y-6">
  <Toast type={sp?.success} />
  <div className="flex flex-col gap-3 print:hidden md:flex-row md:items-center md:justify-between">
    <Link href="/pedidos" className="inline-flex items-center text-sm font-black text-[#8b6a5d] hover:text-[#c98b9b]"><ArrowLeft className="mr-2 h-4 w-4"/>Voltar</Link>
    <div className="flex gap-2"><PrintButton />{phone&&<a href={`https://wa.me/55${phone}?text=${message}`} target="_blank" className="inline-flex items-center rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-white shadow-sm"><MessageCircle className="mr-2 h-4 w-4"/>WhatsApp</a>}</div>
  </div>

  <section className="relative overflow-hidden rounded-[2rem] bg-[#fff8ef] p-8 shadow-sm ring-1 ring-[#ead8cf] print:rounded-none print:shadow-none print:ring-0">
    <div className="absolute left-0 top-0 h-full w-2 bg-[#efb7c8] print:hidden" />
    <div className="mb-8 flex items-start justify-between border-b border-[#ead8cf] pb-6">
      <div className="flex items-center gap-5">
        <div className="relative h-24 w-24 overflow-hidden rounded-full bg-white ring-1 ring-[#ead8cf]"><Image src="/logo.png" alt="La Délice" fill className="object-cover" priority /></div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#9a6d5c]">Doces personalizados para eventos</p>
          <h1 className="mt-2 text-3xl font-black text-[#5b382d]">Orçamento #{String(order.id).padStart(4,"0")}</h1>
          <p className="mt-1 text-[#8b6a5d]">Bolo & Doces Gourmet</p>
        </div>
      </div>
      <div className="text-right"><p className="text-xs font-black uppercase tracking-widest text-[#9a6d5c]">Total</p><p className="text-3xl font-black text-[#5b382d]">{money(order.totalAmount)}</p><p className="mt-2 text-sm text-[#8b6a5d]">Entrega: {longDate(order.deliveryDate)}</p></div>
    </div>

    <div className="mb-8 grid gap-4 md:grid-cols-2">
      <div className="rounded-3xl bg-white/70 p-5 ring-1 ring-[#ead8cf]"><p className="text-xs font-black uppercase tracking-widest text-[#9a6d5c]">Cliente</p><p className="mt-2 text-xl font-black text-[#5b382d]">{order.customerName}</p><p className="text-[#8b6a5d]">{order.customerPhone||"Sem telefone"}</p></div>
      <div className="rounded-3xl bg-white/70 p-5 ring-1 ring-[#ead8cf]"><p className="text-xs font-black uppercase tracking-widest text-[#9a6d5c]">Status</p><p className="mt-2 text-xl font-black capitalize text-[#5b382d]">{order.status}</p></div>
    </div>

    <table className="w-full text-left">
      <thead className="text-xs font-black uppercase tracking-widest text-[#9a6d5c]"><tr className="border-b border-[#efb7c8]"><th className="py-3">Descrição</th><th className="text-center">Qtd.</th><th className="text-right">Valor</th><th className="text-right">Subtotal</th></tr></thead>
      <tbody className="divide-y divide-[#f1c9d5]">{items.map((item,index)=><tr key={index}><td className="py-5 font-bold text-[#5b382d]">{item.recipeName}</td><td className="text-center text-[#7b4b3f]">{item.quantity}</td><td className="text-right text-[#7b4b3f]">{money(item.unitPrice)}</td><td className="text-right font-black text-[#5b382d]">{money(numberValue(item.unitPrice)*item.quantity)}</td></tr>)}</tbody>
    </table>
    {order.notes&&<div className="mt-8 rounded-3xl bg-white/70 p-5 ring-1 ring-[#ead8cf]"><p className="text-xs font-black uppercase tracking-widest text-[#9a6d5c]">Observações e formas de pagamento</p><p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#7b4b3f]">{order.notes}</p></div>}
  </section>
 </div>;
}
