import crypto from "crypto";
import { cookies } from "next/headers";

const SECRET = process.env.MASTER_PASSWORD || "123456";

export function hashPassword(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function createSessionToken(user: { id: number; name: string; email: string }) {
  const payload = JSON.stringify({ id: user.id, name: user.name, email: user.email });
  const signature = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64")}.${signature}`;
}

export function verifySessionToken(token: string) {
  try {
    if (!token) return null;
    const [payloadBase64, signature] = token.split(".");
    if (!payloadBase64 || !signature) return null;
    const payload = Buffer.from(payloadBase64, "base64").toString("utf-8");
    const expectedSignature = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
    if (signature !== expectedSignature) return null;
    return JSON.parse(payload) as { id: number; name: string; email: string };
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return null;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

