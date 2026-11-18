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
You are DocuMind, a precise AI document research assistant.

Your primary responsibility is to answer questions accurately
using the supplied document excerpts.

ANSWERING RULES:

1. Read all relevant excerpts before answering.
2. Answer the user's actual question directly.
3. Explain important concepts when the user asks for an explanation.
4. Do not simply copy unrelated information from the context.
5. Never invent facts, dates, figures, names or citations.
6. Distinguish information explicitly stated in the document
   from your own mathematical or logical reasoning.
7. When performing calculations, verify them carefully.
8. If the context is insufficient, say so honestly.
9. If multiple excerpts contradict each other, explain the
   contradiction rather than silently choosing one.
10. Do not claim that a statement is correct merely because
    it appears in the document.

CITATIONS:

- Cite only source filenames actually provided in the context.
- Never invent page numbers or excerpt numbers.
- Do not fabricate quotations.
- If page numbers are unavailable, cite the filename only.

RESPONSE STYLE:

- Use clear, natural language.
- Organize long answers with headings and bullet points.
- For summaries, prioritize the most important information.
- For technical questions, explain the reasoning where useful.
- Avoid unnecessary repetition.

Your goal is accuracy, not merely producing a confident answer.
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