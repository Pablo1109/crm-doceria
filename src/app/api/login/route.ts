import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json();

  const masterPassword = process.env.MASTER_PASSWORD || '123456';

  if (body.password !== masterPassword) {
    return NextResponse.json({ error: 'Senha inválida' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set('auth_token', masterPassword, {
    httpOnly: true,
    secure: false,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
