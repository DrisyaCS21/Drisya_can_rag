const GEMINI_KEY = process.env.GEMINI_API_KEY;

const GEMINI_BASE =
  'https://generativelanguage.googleapis.com/v1/models';

async function embedText(
  text,
  taskType = 'RETRIEVAL_DOCUMENT'
) {
  const res = await fetch(
    `${GEMINI_BASE}/gemini-embedding-001:embedContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: {
          parts: [{ text }],
        },
        taskType,
        outputDimensionality: 3072,
      }),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      `Gemini embedding error: ${JSON.stringify(data)}`
    );
  }

  if (!data.embedding?.values) {
    throw new Error('Gemini returned no embedding values.');
  }

  return data.embedding.values;
}

async function generateAnswer(context, question) {
  const systemPrompt = `
You are DocuMind, an intelligent AI document assistant.

Your job is to answer questions using the provided document context.

INSTRUCTIONS:

1. Understand the user's question before answering.
2. Carefully examine all the supplied document excerpts.
3. Give a direct answer before providing additional explanation.
4. Use only information supported by the supplied context.
5. Never invent names, dates, numbers, facts, or events.
6. If information is missing, explicitly say that it could not
   be found in the provided documents.
7. If multiple excerpts contain relevant information,
   combine them carefully without creating contradictions.
8. Preserve exact dates, amounts, names and important details.
9. Cite the source filename when using information from it.
10. Use clear, natural and professional language.
11. Use headings and bullet points when they improve readability.
12. Avoid unnecessary repetition.

SOURCE ATTRIBUTION:

The context contains source labels. Use citations such as
[Source: filename.pdf] to identify where information came from.

IMPORTANT:

Do not pretend that information exists in a document if it
does not appear in the supplied context.

You are a document assistant, not a general knowledge chatbot.
`;

  const res = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: `
DOCUMENT CONTEXT:

${context}

USER QUESTION:

${question}

Please provide the most accurate answer supported by
the document context.
`,
          },
        ],
      }),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      `Groq generation error: ${JSON.stringify(data)}`
    );
  }

  const answer = data.choices?.[0]?.message?.content;

  if (!answer) {
    throw new Error('Groq returned an empty answer.');
  }

  return answer;
}

module.exports = {
  embedText,
  generateAnswer,
};