import { NextResponse } from "next/server";
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const password = String(body.password || "");
  const masterPassword = process.env.MASTER_PASSWORD || "123456";
  if (password !== masterPassword) return NextResponse.json({ error: "Senha inválida" }, { status: 401 });
  const response = NextResponse.json({ success: true });
  response.cookies.set("auth_token", masterPassword, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return response;
}
