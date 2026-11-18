const { pool } = require('./db');

const {
  embedText,
  generateAnswer,
} = require('./embeddings');

async function queryDocuments(question, documentId, userId) {
  // Generate an embedding specifically for retrieval queries.
  const questionEmbedding = await embedText(
    question,
    'RETRIEVAL_QUERY'
  );

  // Retrieve the most relevant chunks belonging to
  // this user's selected document.
  const { rows } = await pool.query(
    `
      SELECT
        d.content,
        d.source,
        1 - (d.embedding <=> $1::vector) AS similarity

      FROM documents d

      INNER JOIN uploaded_documents ud
        ON d.document_id = ud.id

      WHERE ud.id = $2
        AND ud.user_id = $3

      ORDER BY d.embedding <=> $1::vector

      LIMIT 8
    `,
    [
      JSON.stringify(questionEmbedding),
      documentId,
      userId,
    ]
  );

  if (rows.length === 0) {
    return {
      answer: 'No relevant information was found in this document.',
      sources: [],
    };
  }

  // Give the LLM clearly labelled document excerpts.
  const context = rows
    .map((row, index) => {
      return `
EXCERPT ${index + 1}
SOURCE: ${row.source}
SIMILARITY: ${Number(row.similarity).toFixed(3)}

CONTENT:
${row.content}
`;
    })
    .join('\n\n--------------------\n\n');

  const answer = await generateAnswer(context, question);

  return {
    answer,
    sources: [...new Set(rows.map(row => row.source))],
    topSimilarity: Number(rows[0].similarity).toFixed(3),
  };
}

module.exports = { queryDocuments };
