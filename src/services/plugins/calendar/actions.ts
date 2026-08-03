import { z } from "zod";
import { db } from "@/db";
import { calendarEvents } from "@/db/schema";
import { revalidatePath } from "next/cache";

const scheduleEventSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  eventDate: z.string().min(1, "Data do compromisso é obrigatória"), // YYYY-MM-DD
  eventTime: z.string().optional(), // HH:MM
  type: z.enum(["task", "partnership", "meeting", "other"]).default("task")
});

export const scheduleEventAction = {
  name: "schedule_event",
  description: "Cadastra um compromisso, tarefa, reunião ou parceria no calendário.",
  inputSchema: scheduleEventSchema,
  execute: async (input: z.infer<typeof scheduleEventSchema>) => {
    const [event] = await db.insert(calendarEvents).values({
      title: input.title,
      description: input.description || null,
      eventDate: input.eventDate,
      eventTime: input.eventTime || null,
      type: input.type
    }).returning();

    revalidatePath("/calendario");
    revalidatePath("/");
    return {
      success: true,
      message: `Compromisso '${event.title}' agendado com sucesso para ${event.eventDate}!`,
      event
    };
  }
};


