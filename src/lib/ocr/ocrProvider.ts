export async function extractTextFromImage(imageBase64: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY não configurada. Usando resposta OCR Mock.");
    return getMockOcrText();
  }

  // Limpar cabeçalho do base64 se houver (ex: data:image/png;base64,...)
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

  // Vamos chutar que a imagem é jpeg, mas o Gemini aceita a maioria dos formatos normais.
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: "Realize o OCR completo desta imagem. Extraia todos os textos, fornecedores, produtos, quantidades e valores de forma exata, mantendo a estrutura original."
              },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: base64Data
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini OCR API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const textResult = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResult) {
      throw new Error("OCR retornou texto vazio.");
    }

    return textResult.trim();
  } catch (err) {
    console.error("Erro no processamento OCR via Gemini:", err);
    throw err;
  }
}

function getMockOcrText(): string {
  return `
--- RECIBO DE COMPRA ---
FORNECEDOR: Distribuidora de Doces Copacol S.A.
DATA: ${new Date().toLocaleDateString("pt-BR")}

PRODUTOS ADQUIRIDOS:
1. Leite Condensado Moça 395g - 10 unidades - R$ 9,00 cada - Total R$ 90,00
2. Creme de Leite Nestlé 200g - 6 unidades - R$ 4,50 cada - Total R$ 27,00
3. Granulado Chocolate Melken 500g - 2 pacotes - R$ 18,50 cada - Total R$ 37,00

VALOR TOTAL DA NOTA: R$ 154,00
PAGAMENTO: Efetuado em dinheiro
`;
}
