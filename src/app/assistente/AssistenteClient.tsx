"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Image as ImageIcon, 
  Loader2, 
  Sparkles, 
  Trash2, 
  X, 
  Check, 
  AlertTriangle,
  HelpCircle,
  FileText,
  Calendar,
  DollarSign,
  Boxes,
  Mic,
  MicOff
} from "lucide-react";
import { sendMessageToAssistant, executeConfirmAction, executeCancelAction } from "./actions";
import Image from "next/image";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
  attachments?: string; // base64
  intent?: string;
  parsedJson?: string;
  executedAction?: string;
  success?: boolean;
  createdAt: Date;
};

type AssistenteClientProps = {
  conversationId: number;
  initialMessages: Message[];
};

export default function AssistenteClient({ conversationId, initialMessages }: AssistenteClientProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [executingMessageId, setExecutingMessageId] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const toggleListening = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Navegador não possui suporte nativo para ditado por voz. Tente usar o Google Chrome ou Microsoft Edge.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "pt-BR";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() && !imagePreview) return;

    const currentText = inputValue;
    const currentImg = imagePreview || undefined;

    setInputValue("");
    setImagePreview(null);
    setLoading(true);

    try {
      const result = await sendMessageToAssistant(conversationId, currentText, currentImg);
      
      // Mapear respostas do banco
      const userMsg: Message = {
        id: result.userMessage.id,
        role: "user",
        content: result.userMessage.content,
        attachments: result.userMessage.attachments || undefined,
        createdAt: new Date(result.userMessage.createdAt)
      };

      const assistantMsg: Message = {
        id: result.assistantMessage.id,
        role: "assistant",
        content: result.assistantMessage.content,
        intent: result.assistantMessage.intent || undefined,
        parsedJson: result.assistantMessage.parsedJson || undefined,
        executedAction: result.assistantMessage.executedAction || undefined,
        success: result.assistantMessage.success || false,
        createdAt: new Date(result.assistantMessage.createdAt)
      };

      setMessages(prev => [...prev, userMsg, assistantMsg]);
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async (msgId: number) => {
    setExecutingMessageId(msgId);
    try {
      await executeConfirmAction(msgId);
      
      // Recarregar histórico local das mensagens atualizado com a confirmação
      setMessages(prev => 
        prev.map(m => m.id === msgId ? { ...m, executedAction: m.intent, success: true } : m)
      );

      // Inserir mensagem de confirmação de sucesso
      const successMessage: Message = {
        id: Math.random(),
        role: "assistant",
        content: JSON.stringify({
          intent: null,
          confidence: 100,
          needsConfirmation: false,
          missingFields: [],
          warnings: [],
          extractedData: null,
          explanation: "✅ Operação efetuada e gravada com sucesso!"
        }),
        createdAt: new Date()
      };
      setMessages(prev => [...prev, successMessage]);
    } catch (err) {
      console.error("Erro ao executar ação:", err);
    } finally {
      setExecutingMessageId(null);
    }
  };

  const handleCancelAction = async (msgId: number) => {
    try {
      await executeCancelAction(msgId);
      setMessages(prev => 
        prev.map(m => m.id === msgId ? { ...m, executedAction: "cancelled", success: false } : m)
      );

      const cancelMessage: Message = {
        id: Math.random(),
        role: "assistant",
        content: JSON.stringify({
          intent: null,
          confidence: 100,
          needsConfirmation: false,
          missingFields: [],
          warnings: [],
          extractedData: null,
          explanation: "🚫 Operação cancelada pelo usuário."
        }),
        createdAt: new Date()
      };
      setMessages(prev => [...prev, cancelMessage]);
    } catch (err) {
      console.error("Erro ao cancelar ação:", err);
    }
  };

  // Renderizar o conteúdo estruturado da IA
  const renderAssistantContent = (msg: Message) => {
    try {
      const parsed = JSON.parse(msg.content);
      
      const intent = parsed.intent;
      const explanation = parsed.explanation || "";
      const extractedData = parsed.extractedData;
      const needsConfirmation = parsed.needsConfirmation;
      const missingFields = parsed.missingFields || [];
      const warnings = parsed.warnings || [];
      const confidence = parsed.confidence || 0;

      const isExecuted = !!msg.executedAction;
      const isCancelled = msg.executedAction === "cancelled";

      return (
        <div className="space-y-4">
          <p className="text-sm font-medium leading-relaxed text-[#5b382d]">{explanation}</p>

          {/* Warnings / Alertas da IA */}
          {warnings.length > 0 && (
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3.5 space-y-1">
              <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Atenção da IA
              </span>
              {warnings.map((w: string, i: number) => (
                <p key={i} className="text-xs text-amber-700 font-semibold">{w}</p>
              ))}
            </div>
          )}

          {/* Missing Fields / Campos faltantes */}
          {missingFields.length > 0 && (
            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3.5 space-y-1">
              <span className="text-[10px] font-black text-rose-800 uppercase tracking-wider flex items-center gap-1">
                <HelpCircle className="h-3.5 w-3.5" /> Informações ausentes
              </span>
              <p className="text-xs text-rose-700 font-semibold">
                Para cadastrar corretamente, por favor me informe: <span className="font-black underline">{missingFields.join(", ")}</span>.
              </p>
            </div>
          )}

          {/* Dados Extraídos Estruturados */}
          {extractedData && intent && (
            <div className="rounded-3xl border border-[#ead8cf] bg-[#fffcf9] p-4.5 space-y-3.5 shadow-sm">
              <div className="flex justify-between items-center border-b border-[#f0ded6] pb-2">
                <span className="text-xs font-black uppercase text-[#9a6d5c] flex items-center gap-1.5">
                  {intent === "create_order" && <FileText className="h-4 w-4 text-[#c98b9b]" />}
                  {intent === "create_purchase" && <Boxes className="h-4 w-4 text-[#c98b9b]" />}
                  {intent === "schedule_event" && <Calendar className="h-4 w-4 text-[#c98b9b]" />}
                  {intent === "consult_finance" && <DollarSign className="h-4 w-4 text-[#c98b9b]" />}
                  Ação Proposta: {intent.toUpperCase().replace("_", " ")}
                </span>
                <span className="text-[10px] font-black bg-[#ffeef2] text-[#c98b9b] px-2.5 py-0.5 rounded-full">
                  Confiança: {confidence}%
                </span>
              </div>

              {/* Detalhes específicos de acordo com a Action */}
              {intent === "create_order" && (
                <div className="space-y-2 text-xs">
                  <p className="text-[#5b382d] font-bold">Cliente: <span className="font-black">{extractedData.customerName}</span></p>
                  {extractedData.customerPhone && <p className="text-slate-500 font-semibold">Telefone: {extractedData.customerPhone}</p>}
                  <p className="text-[#5b382d] font-bold">Data de Entrega: <span className="font-black">{extractedData.deliveryDate}</span> {extractedData.deliveryTime ? `às ${extractedData.deliveryTime}` : ""}</p>
                  <p className="text-[#5b382d] font-bold">Valor Total: <span className="font-black text-sm text-[#c98b9b]">R$ {Number(extractedData.totalAmount || 0).toFixed(2)}</span></p>
                  {extractedData.signal > 0 && <p className="text-emerald-600 font-bold">Sinal Pago: R$ {Number(extractedData.signal).toFixed(2)}</p>}
                  
                  {extractedData.items && extractedData.items.length > 0 && (
                    <div className="mt-2.5 border-t border-[#f0ded6]/60 pt-2 space-y-1">
                      <p className="font-black text-[#9a6d5c] text-[10px] uppercase">Doces Selecionados:</p>
                      {extractedData.items.map((it: any, idx: number) => (
                        <div key={idx} className="flex justify-between font-semibold text-slate-700 text-[11px]">
                          <span>Receita ID #{it.recipeId} x {it.quantity} un</span>
                          <span>R$ {Number(it.unitPrice || 0).toFixed(2)} un</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {intent === "create_purchase" && (
                <div className="space-y-2 text-xs">
                  <p className="text-[#5b382d] font-bold">Fornecedor: <span className="font-black">{extractedData.supplier || "Geral / Não informado"}</span></p>
                  <p className="text-[#5b382d] font-bold">Data da Compra: <span className="font-black">{extractedData.date}</span></p>
                  
                  {extractedData.items && extractedData.items.length > 0 && (
                    <div className="mt-2.5 border-t border-[#f0ded6]/60 pt-2 space-y-1.5">
                      <p className="font-black text-[#9a6d5c] text-[10px] uppercase">Insumos Comprados:</p>
                      {extractedData.items.map((it: any, idx: number) => (
                        <div key={idx} className="flex justify-between font-semibold text-slate-700 text-[11px]">
                          <span>Ingrediente ID #{it.ingredientId} x {it.packageCount} emb.</span>
                          <span>Preço: R$ {Number(it.purchasePrice || 0).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {intent === "schedule_event" && (
                <div className="space-y-2 text-xs text-[#5b382d] font-semibold">
                  <p>Título: <span className="font-black">{extractedData.title}</span></p>
                  {extractedData.description && <p className="text-slate-500">Descrição: {extractedData.description}</p>}
                  <p>Data: <span className="font-black">{extractedData.eventDate}</span> {extractedData.eventTime ? `às ${extractedData.eventTime}` : ""}</p>
                  <p className="capitalize">Tipo: {extractedData.type}</p>
                </div>
              )}

              {/* Botões de Ações de Confirmação */}
              {needsConfirmation && !isExecuted && (
                <div className="flex gap-2.5 pt-2 border-t border-[#f0ded6]/60">
                  <button
                    onClick={() => handleConfirmAction(msg.id)}
                    disabled={executingMessageId === msg.id}
                    className="flex-1 inline-flex justify-center items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black py-2.5 transition cursor-pointer disabled:opacity-50"
                  >
                    {executingMessageId === msg.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    Confirmar Cadastro
                  </button>
                  <button
                    onClick={() => handleCancelAction(msg.id)}
                    disabled={executingMessageId === msg.id}
                    className="rounded-xl border border-[#ead8cf] bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 text-xs font-black px-4 py-2.5 transition cursor-pointer disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </div>
              )}

              {/* Indicador de Status pós-execução */}
              {isExecuted && (
                <div className="pt-2 border-t border-[#f0ded6]/60 text-center">
                  {isCancelled ? (
                    <span className="text-[10px] uppercase font-black text-rose-500">🚫 Cancelado</span>
                  ) : (
                    <span className="text-[10px] uppercase font-black text-emerald-600 flex items-center justify-center gap-1">
                      <Check className="h-3.5 w-3.5" /> Lançado no sistema
                    </span>
                  )}
                </div>
              )}

            </div>
          )}
        </div>
      );
    } catch {
      // Fallback para mensagens de texto comuns
      return <p className="text-sm font-medium leading-relaxed text-[#5b382d]">{msg.content}</p>;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-5xl mx-auto border border-[#ead8cf] bg-white/70 rounded-[2.5rem] shadow-sm overflow-hidden backdrop-blur-md">
      
      {/* Cabeçalho do Assistente */}
      <div className="flex items-center justify-between border-b border-[#ead8cf] bg-white/90 p-5 z-10">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff1f4] text-[#c98b9b]">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-[#5b382d]">Assistente Operacional IA</h2>
            <p className="text-[10px] font-bold text-[#9a6d5c]">Conectada ao Gemini 1.5 Flash • La Délice ERP</p>
          </div>
        </div>
        <button 
          onClick={() => {
            if (confirm("Deseja limpar todo o histórico local desta conversa?")) {
              setMessages([]);
            }
          }}
          className="text-[#9a6d5c] hover:text-rose-500 p-2.5 rounded-xl hover:bg-rose-50/50 transition cursor-pointer"
        >
          <Trash2 className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Feed do Chat */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#fffcf9]/30">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-toast-in`}
          >
            <div 
              className={`max-w-xl rounded-[2rem] p-5 shadow-sm ${
                msg.role === "user"
                  ? "bg-[#5b382d] text-white rounded-tr-none"
                  : "bg-white border border-[#ead8cf] rounded-tl-none"
              }`}
            >
              {/* Exibir imagem anexada se for usuário */}
              {msg.role === "user" && msg.attachments && (
                <div className="relative w-44 h-44 rounded-2xl overflow-hidden mb-3 border border-white/20">
                  <Image src={msg.attachments} alt="Anexo OCR" fill className="object-cover" />
                </div>
              )}

              {msg.role === "user" ? (
                <p className="text-sm font-semibold leading-relaxed">{msg.content}</p>
              ) : (
                renderAssistantContent(msg)
              )}

              <span className={`block text-[9px] mt-2 font-bold ${msg.role === "user" ? "text-white/60 text-right" : "text-[#9a6d5c]"}`}>
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-white border border-[#ead8cf] rounded-[2rem] rounded-tl-none p-5 max-w-xs flex items-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin text-[#c98b9b]" />
              <span className="text-xs font-black text-[#9a6d5c] uppercase tracking-wider">Interpretando...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Caixa de Entrada e Upload */}
      <form onSubmit={handleSend} className="border-t border-[#ead8cf] bg-white p-4 space-y-3">
        {imagePreview && (
          <div className="flex items-center gap-2 bg-[#fffcf9] border border-[#ead8cf] p-2.5 rounded-2xl w-fit relative animate-toast-in">
            <div className="relative w-16 h-16 rounded-xl overflow-hidden">
              <Image src={imagePreview} alt="Preview do recibo" fill className="object-cover" />
            </div>
            <button
              type="button"
              onClick={() => setImagePreview(null)}
              className="absolute -top-1.5 -right-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-1 cursor-pointer shadow-md"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <span className="text-[10px] font-black text-[#9a6d5c] pr-2 uppercase">Imagem anexada para OCR</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={toggleListening}
            className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-center ${
              isListening 
                ? "bg-red-500 border-red-600 text-white animate-bounce shadow-md" 
                : "border-[#ead8cf] bg-white hover:bg-[#fff1f4] text-[#9a6d5c] hover:text-[#c98b9b]"
            }`}
            title={isListening ? "Ouvindo... Clique para parar" : "Ditar comando por voz (Microfone)"}
          >
            {isListening ? <MicOff className="h-5 w-5 animate-pulse" /> : <Mic className="h-5 w-5" />}
          </button>

          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={isListening ? "Fale seu comando agora..." : "Digite ou dite sua encomenda / comando operacional..."}
            className={`flex-1 rounded-2xl border px-4.5 py-3.5 text-sm font-semibold focus:outline-none transition ${
              isListening ? "border-red-400 bg-red-50/40 text-red-900 placeholder:text-red-400" : "border-[#ead8cf] bg-[#fff8ef]/25 placeholder:text-[#9a6d5c]/60 text-[#5b382d]"
            }`}
          />

          <button
            type="submit"
            disabled={loading || (!inputValue.trim() && !imagePreview)}
            className="p-3.5 rounded-2xl bg-[#5b382d] hover:bg-[#c98b9b] text-white transition cursor-pointer disabled:opacity-50 flex items-center justify-center"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>

    </div>
  );
}
