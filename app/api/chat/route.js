import OpenAI from 'openai';

// Vercel Hobby tier defaults to a 10s function timeout, too short for a
// classroom-loaded local model, which can occasionally run past that under
// concurrent student traffic. Hobby allows up to 60s with this export.
export const maxDuration = 60;

const client = new OpenAI({
  baseURL: process.env.OLLAMA_BASE_URL,
  apiKey: process.env.VCS_API_SECRET,
});

export async function POST(req) {
  let topic;
  try {
     ({ topic } = await req.json());
   } catch {
     // Non-JSON request body. Always answer with JSON so the client never
     // tries to parse plain text as JSON.
    return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
   }

  if (!topic) {
    return Response.json({ error: 'A "topic" is required.' }, { status: 400 });
   }

  try {
    const completion = await client.chat.completions.create({
      model: process.env.OLLAMA_MODEL,
      messages: [
         {
          role: 'user',
          content: `Explain ${topic} in exactly 3 bullet points.`,
         },
       ],
     });
    return Response.json(completion.choices[0].message);
   } catch (err) {
     // The model call can fail (bad key, wrong model, gateway error, timeout).
     // Always return JSON on failure so the client never receives a non-JSON
     // body, which is what caused the "is not valid JSON" crash.
    console.error('Chat completion failed:', err?.message ?? err);
    const message = err?.message ?? 'Unknown server error.';
    return Response.json({ error: message }, { status: 502 });
   }
}