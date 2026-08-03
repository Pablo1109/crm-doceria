import { getOrCreateConversation, getConversationMessages } from "./actions";
import AssistenteClient from "./AssistenteClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Assistente IA Operacional | La Délice",
};

export default async function AssistentePage() {
  const conversationId = await getOrCreateConversation();
  const initialMessages = await getConversationMessages(conversationId);

  // Mapear os tipos de mensagens retornados pelo banco para tipos limpos no cliente
  const formattedMessages = initialMessages.map((m: any) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    content: m.content,
    attachments: m.attachments || undefined,
    intent: m.intent || undefined,
    parsedJson: m.parsedJson || undefined,
    executedAction: m.executedAction || undefined,
    success: m.success || false,
    createdAt: m.createdAt,
  }));

  return (
    <AssistenteClient 
      conversationId={conversationId} 
      initialMessages={formattedMessages} 
    />
  );
}
