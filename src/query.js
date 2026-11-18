
const { pool } = require('./db');
const { embedText, generateAnswer } = require('./embeddings');

async function queryDocuments(question, documentId, userId) {
  const questionEmbedding = await embedText(question);

  const { rows } = await pool.query(
    `SELECT
       d.content,
       d.source,
       1 - (d.embedding <=> $1::vector) AS similarity
     FROM documents d
     INNER JOIN uploaded_documents ud
       ON d.document_id = ud.id
     WHERE ud.id = $2
       AND ud.user_id = $3
     ORDER BY d.embedding <=> $1::vector
     LIMIT 5`,
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

  const context = rows
    .map(row => row.content)
    .join('\n\n---\n\n');

  const answer = await generateAnswer(context, question);

  return {
    answer,
    sources: [...new Set(rows.map(row => row.source))],
    topSimilarity: Number(rows[0].similarity).toFixed(3),
  };
}

module.exports = { queryDocuments };
