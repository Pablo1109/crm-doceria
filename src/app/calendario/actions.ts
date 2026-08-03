"use server";
import { db } from "@/db";
import { calendarEvents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function addCalendarEvent(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const eventDate = String(formData.get("eventDate") || "");
  const eventTime = String(formData.get("eventTime") || "") || null;
  const type = String(formData.get("type") || "task");

  if (!title || !eventDate) return;

  await db.insert(calendarEvents).values({
    title,
    description: description || null,
    eventDate,
    eventTime,
    type,
  });

  revalidatePath("/calendario");
  revalidatePath("/");
}

export async function deleteCalendarEvent(id: number) {
  await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
  revalidatePath("/calendario");
  revalidatePath("/");
}
