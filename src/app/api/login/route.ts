import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { hashPassword, createSessionToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json({ error: "Preencha e-mail e senha" }, { status: 400 });
    }

    const hashedPassword = hashPassword(password);

    // Buscar usuário com e-mail e senha corretos
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email), eq(users.password, hashedPassword)))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "E-mail ou senha incorretos" }, { status: 401 });
    }

    const response = NextResponse.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
    const token = createSessionToken(user);
    
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 semana
    });

    return response;
  } catch (error: any) {
    console.error("Erro no login:", error);
    const detail = error.cause?.message || error.cause || error.detail || "";
    return NextResponse.json({ 
      error: `Erro interno no servidor: ${error.message}${detail ? ` (Detalhe: ${detail})` : ""}` 
    }, { status: 500 });
  }
}
