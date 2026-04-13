import Anthropic from "npm:@anthropic-ai/sdk@0.27.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const anthropic = new Anthropic({
  apiKey: Deno.env.get("ANTHROPIC_API_KEY")!,
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) {
      return new Response(JSON.stringify({ error: "No file provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const bytes = await file.arrayBuffer();
    const base64 = btoa(
      String.fromCharCode(...new Uint8Array(bytes))
    );
    const mediaType = (file.type || "image/jpeg") as
      | "image/jpeg"
      | "image/png"
      | "image/gif"
      | "image/webp";

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            {
              type: "text",
              text: `Analise esta imagem de um produto e retorne um JSON com as seguintes informações em português. Se não conseguir identificar algum campo, use null.

Responda APENAS com o JSON válido, sem explicações:
{
  "description": "nome completo do produto (ex: Smartphone Samsung Galaxy A54 128GB)",
  "brand": "marca do produto",
  "model": "modelo específico (ex: Galaxy A54, iPhone 15 Pro, Notebook Ideapad 3)",
  "characteristics": "características principais separadas por vírgula (cor, capacidade, tamanho, etc.)",
  "barcode": "código de barras ou QR Code se visível na imagem, caso contrário null"
}`,
            },
          ],
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "{}";

    let parsed: Record<string, string | null> = {};
    try {
      const match = text.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : {};
    } catch {
      parsed = { description: text, brand: null, model: null, characteristics: null, barcode: null };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
