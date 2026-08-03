import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { hashPassword, createSessionToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const inviteCode = String(body.inviteCode || "");

    const masterPassword = process.env.MASTER_PASSWORD || "123456";

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Preencha todos os campos obrigatórios" }, { status: 400 });
    }

    if (inviteCode !== masterPassword) {
      return NextResponse.json({ error: "Código de convite/acesso inválido" }, { status: 401 });
    }

    // Verificar se o e-mail já existe
    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing) {
      return NextResponse.json({ error: "Este e-mail já está cadastrado" }, { status: 400 });
    }

    const hashedPassword = hashPassword(password);

    const [newUser] = await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
      role: "user",
    }).returning();

    const response = NextResponse.json({ success: true, user: { id: newUser.id, name: newUser.name, email: newUser.email } });
    const token = createSessionToken(newUser);
    
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 semana
    });

    return response;
  } catch (error: any) {
    console.error("Erro no cadastro:", error);
    const detail = error.cause?.message || error.cause || error.detail || "";
    return NextResponse.json({ 
      error: `Erro interno no servidor: ${error.message}${detail ? ` (Detalhe: ${detail})` : ""}` 
    }, { status: 500 });
  }
}
