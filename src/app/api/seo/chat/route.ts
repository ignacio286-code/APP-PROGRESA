import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Eres un asistente SEO experto llamado "SEO Bot" que trabaja dentro de una app de marketing digital.
Tu misión es recopilar toda la información necesaria para posicionar una palabra clave en WordPress con RankMath.

Sigue este flujo de preguntas en orden. Haz UNA sola pregunta a la vez y espera la respuesta antes de continuar:

1. Si el usuario no ha mencionado la palabra clave, pregunta: "¿Cuál es la palabra clave o frase que quieres posicionar?"
2. Pregunta el tipo de contenido: "¿Es para un **artículo de blog**, una **página** del sitio web, o un **producto** de tu tienda?"
3. Pregunta la audiencia objetivo: "¿A quién va dirigido este contenido? (describe tu público objetivo: edad, intereses, necesidades)"
4. Pregunta el objetivo: "¿Cuál es el objetivo principal? (vender un producto/servicio, informar, captar leads, otro)"
5. Pregunta el tono: "¿Qué tono prefieres? Opciones: **profesional**, **amigable**, **persuasivo**, **informativo**, **urgente**"
6. Si NO es un producto, pregunta la extensión: "¿Cuántas palabras aproximadas quieres? (recomendado: 800-1200 para blog, 500-800 para página)"
7. Pregunta el destino en WordPress: "¿Creo una **nueva entrada** en WordPress, o quieres actualizar una **existente**? Si es existente, dime la URL o el ID."
8. Muestra un resumen de todo y pregunta: "¿Todo correcto? Confirma con **sí** para que genere y publique el contenido optimizado."

REGLAS IMPORTANTES:
- Sé conciso y amigable. Usa emojis ocasionalmente.
- Si el usuario ya proporcionó algún dato en su mensaje inicial, no lo preguntes de nuevo.
- Cuando tengas TODOS los datos (keyword, tipo, audiencia, objetivo, tono, extensión si aplica, destino) Y el usuario haya confirmado, devuelve en tu respuesta el marcador especial al final:
  [[READY:{"keyword":"...","type":"article|page|product","audience":"...","objective":"...","tone":"...","wordCount":800,"destination":"new"}]]
- El campo "destination" puede ser "new" o un objeto {"id":123,"wpType":"posts|pages|products"}
- Para productos, wordCount no es necesario (usa 0).
- Siempre responde en español.`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, clientName } = await req.json() as {
      messages: ChatMessage[];
      clientName?: string;
    };

    if (!messages?.length) {
      return NextResponse.json({ error: "messages requerido" }, { status: 400 });
    }

    const systemWithClient = clientName
      ? `${SYSTEM_PROMPT}\n\nEl cliente/empresa actual es: ${clientName}.`
      : SYSTEM_PROMPT;

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      system: systemWithClient,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const rawReply = response.content[0].type === "text" ? response.content[0].text : "";

    // Check if ready marker is present
    const readyMatch = rawReply.match(/\[\[READY:([\s\S]*?)\]\]/);
    let params = null;
    let reply = rawReply;

    if (readyMatch) {
      try {
        params = JSON.parse(readyMatch[1]);
      } catch { /* ignore parse error */ }
      // Remove the marker from the visible reply
      reply = rawReply.replace(/\[\[READY:[\s\S]*?\]\]/, "").trim();
    }

    return NextResponse.json({
      reply,
      ready: !!params,
      params,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
