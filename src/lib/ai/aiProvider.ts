export interface AIResponse {
  intent: string | null;
  confidence: number; // 0 a 100
  needsConfirmation: boolean;
  missingFields: string[];
  warnings: string[];
  extractedData: Record<string, any> | null;
  explanation: string;
}

export async function generateStructuredResponse(
  prompt: string, 
  history: { role: "user" | "model"; parts: string[] }[] = [],
  systemInstruction?: string
): Promise<AIResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY não configurada. Usando resposta Mock para testes.");
    return getMockResponse(prompt);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  // Formatar histórico de acordo com a API do Gemini
  const formattedContents = [
    ...history.map(h => ({
      role: h.role === "model" ? "model" : "user", // Garante o role mapeado correto
      parts: h.parts.map(p => ({ text: p }))
    })),
    {
      role: "user",
      parts: [{ text: prompt }]
    }
  ];

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: formattedContents,
        systemInstruction: systemInstruction ? {
          parts: [{ text: systemInstruction }]
        } : undefined,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const rawJsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawJsonText) {
      throw new Error("Resposta vazia da API do Gemini.");
    }

    // Remover cercas de código markdown (```json ... ```) se presentes
    const cleanedText = rawJsonText
      .trim()
      .replace(/^```(json)?/i, "")
      .replace(/```$/i, "")
      .trim();

    const parsed = JSON.parse(cleanedText) as AIResponse;
    return {
      intent: parsed.intent || null,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0,
      needsConfirmation: !!parsed.needsConfirmation,
      missingFields: Array.isArray(parsed.missingFields) ? parsed.missingFields : [],
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
      extractedData: parsed.extractedData || null,
      explanation: parsed.explanation || "Não consegui processar a solicitação.",
    };
  } catch (err) {
    console.error("Erro ao chamar a IA (Gemini):", err);
    // Tenta fallback dinâmico local se houver falha de rede/parse
    return getMockResponse(prompt);
  }
}

// Respostas dinâmicas inteligentes locais (Fallback / Testes)
function getMockResponse(prompt: string): AIResponse {
  const p = prompt.toLowerCase();
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  // Tentar extrair números do texto
  const numbers = (prompt.match(/\d+/g) || []).map(Number);
  const qty = numbers[0] || 50;
  const price = numbers[1] || 150;

  // Extrair possível nome do cliente
  const clientMatch = prompt.match(/(?:para|cliente|de)\s+([A-Z][a-zà-ú]+(?:\s+[A-Z][a-zà-ú]+)?)/i);
  const customerName = clientMatch ? clientMatch[1] : "Cliente Novo";

  // Palavras-chave para Compras / Insumos de Estoque (ex: "comprei 5 caixas de creme de leite")
  const isPurchase = 
    p.includes("compra") || p.includes("comprei") || p.includes("comprar") || 
    p.includes("gastei") || p.includes("gasto") || p.includes("adquiri") || 
    p.includes("adquirir") || p.includes("paguei") || p.includes("peguei") || 
    p.includes("trouxe") || p.includes("chegou") || p.includes("caixa") || 
    p.includes("lata") || p.includes("pacote") || p.includes("saco") || 
    p.includes("creme de leite") || p.includes("leite condensado");

  // Palavras-chave para Encomendas / Pedidos
  const isOrder = 
    p.includes("encomenda") || p.includes("encomendei") || p.includes("pedido") || 
    p.includes("pedi") || p.includes("vendi") || p.includes("venda") || 
    p.includes("brigadeiro") || p.includes("doce") || p.includes("bolo");

  if (isPurchase) {
    // Detectar ingrediente mencionado no texto
    let itemDesc = "creme de leite";
    if (p.includes("leite condensado")) itemDesc = "leite condensado";
    else if (p.includes("creme de leite")) itemDesc = "creme de leite";
    else if (p.includes("chocolate") || p.includes("cacau")) itemDesc = "chocolate";
    else if (p.includes("açúcar")) itemDesc = "açúcar";
    else if (p.includes("farinha") || p.includes("trigo")) itemDesc = "farinha de trigo";
    else if (p.includes("manteiga") || p.includes("margarina")) itemDesc = "manteiga";

    const packageCount = qty > 0 ? (qty > 100 ? 1 : qty) : 5;
    const estPrice = price > 0 && price !== qty ? price : packageCount * 7.50;

    return {
      intent: "create_purchase",
      confidence: 92,
      needsConfirmation: true,
      missingFields: [],
      warnings: [],
      extractedData: {
        supplier: "Atacado / Mercado",
        date: today,
        items: [
          { ingredientId: 1, packageCount, purchasePrice: Number(estPrice.toFixed(2)) }
        ]
      },
      explanation: `Identifiquei o registro de compra de ${packageCount} embalagens de ${itemDesc} no valor aproximado de R$ ${estPrice.toFixed(2)}.`
    };
  }

  if (isOrder) {
    return {
      intent: "create_order",
      confidence: 90,
      needsConfirmation: true,
      missingFields: [],
      warnings: [],
      extractedData: {
        customerName,
        deliveryDate: p.includes("hoje") ? today : tomorrow,
        totalAmount: price,
        notes: `Encomenda de ${qty} doces inserida via comando de voz/assistente.`,
        items: [
          { recipeId: 1, quantity: qty, unitPrice: Number((price / qty).toFixed(2)) }
        ]
      },
      explanation: `Identifiquei encomenda para ${customerName} de ${qty} doces no valor de R$ ${price.toFixed(2)}.`
    };
  }

  if (p.includes("quanto") || p.includes("saldo") || p.includes("tem") || p.includes("disponível")) {
    return {
      intent: "consult_inventory",
      confidence: 95,
      needsConfirmation: false,
      missingFields: [],
      warnings: [],
      extractedData: {},
      explanation: "Vou consultar o saldo atual dos ingredientes em estoque para você."
    };
  }

  return {
    intent: null,
    confidence: 100,
    needsConfirmation: false,
    missingFields: [],
    warnings: [],
    extractedData: null,
    explanation: "Olá! Sou a assistente da doceria La Délice. Você pode ditar ou digitar pedidos, compras de estoque ou consultar saldos."
  };
}
