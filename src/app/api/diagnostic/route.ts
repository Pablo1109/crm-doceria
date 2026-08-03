import { db } from "@/db";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Tentar executar query simples
    await db.execute(sql`select 1`);

    // 2. Listar tabelas públicas existentes
    const tablesResult = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    const tables = tablesResult.rows.map((r: any) => r.table_name);

    return NextResponse.json({
      success: true,
      status: "Conectado ao Banco de Dados com sucesso!",
      databaseUrlConfigured: !!process.env.DATABASE_URL,
      tables,
    });
  } catch (err: any) {
    console.error("Erro no diagnóstico do banco:", err);
    return NextResponse.json({
      success: false,
      status: "Falha na conexão com o Banco de Dados",
      errorMessage: err.message,
      cause: err.cause?.message || err.cause || err.detail || "Desconhecida",
    }, { status: 500 });
  }
}
