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

    const parsed = JSON.parse(rawJsonText.trim()) as AIResponse;
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
    return {
      intent: null,
      confidence: 0,
      needsConfirmation: false,
      missingFields: [],
      warnings: ["Erro ao conectar com o serviço de IA local/remoto."],
      extractedData: null,
      explanation: "Desculpe, ocorreu uma falha interna ao processar com a IA. Por favor, tente novamente ou verifique as credenciais."
    };
  }
}

// Respostas simuladas (Mocks) para o ambiente de testes caso não haja chave de API
function getMockResponse(prompt: string): AIResponse {
  const p = prompt.toLowerCase();
  
  if (p.includes("encomenda") || p.includes("pedido")) {
    return {
      intent: "create_order",
      confidence: 95,
      needsConfirmation: true,
      missingFields: [],
      warnings: [],
      extractedData: {
        customerName: "Dr Jump",
        deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0], // amanhã
        totalAmount: 420.00,
        notes: "Encomenda de 120 brigadeiros (40 trad, 40 ninho, 40 beijinho)",
        items: [
          { recipeId: 1, quantity: 40, unitPrice: 3.50 },
          { recipeId: 2, quantity: 40, unitPrice: 3.50 },
          { recipeId: 3, quantity: 40, unitPrice: 3.50 }
        ]
      },
      explanation: "Identifiquei uma intenção de cadastrar encomenda para o Dr Jump de 120 doces no total de R$ 420,00."
    };
  }

  if (p.includes("compra") || p.includes("gastei") || p.includes("adquirir")) {
    return {
      intent: "create_purchase",
      confidence: 90,
      needsConfirmation: true,
      missingFields: [],
      warnings: [],
      extractedData: {
        supplier: "Mercado Central",
        date: new Date().toISOString().split("T")[0],
        items: [
          { ingredientId: 1, packageCount: 5, purchasePrice: 45.00 },
          { ingredientId: 2, packageCount: 2, purchasePrice: 15.00 }
        ]
      },
      explanation: "Identifiquei um registro de compra do fornecedor Mercado Central."
    };
  }

  return {
    intent: null,
    confidence: 100,
    needsConfirmation: false,
    missingFields: [],
    warnings: [],
    extractedData: null,
    explanation: "Olá! Sou a assistente operacional da doceria. Posso te ajudar a cadastrar encomendas, registrar compras no estoque, consultar finanças ou agendar eventos."
  };
}
