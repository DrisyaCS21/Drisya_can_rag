
const { PDFParse } = require('pdf-parse');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('./db');
const { embedText } = require('./embeddings');

function chunkText(text, chunkSize = 500, overlap = 50) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end).trim());
    start += chunkSize - overlap;
  }

  return chunks.filter(chunk => chunk.length > 50);
}

async function ingestDocument(buffer, filename, userId) {
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    const chunks = chunkText(result.text);

    if (chunks.length === 0) {
      throw new Error('No readable text found in this PDF.');
    }

    console.log(`Processing ${chunks.length} chunks from "${filename}"`);

    // Generate embeddings before opening the database transaction.
    const embeddedChunks = [];

    for (const chunk of chunks) {
      const embedding = await embedText(chunk);

      embeddedChunks.push({
        content: chunk,
        embedding,
      });
    }

    const client = await pool.connect();
    const documentId = uuidv4();

    try {
      await client.query('BEGIN');

      await client.query(
        `INSERT INTO uploaded_documents (id, user_id, filename)
         VALUES ($1, $2, $3)`,
        [documentId, userId, filename]
      );

      for (const item of embeddedChunks) {
        await client.query(
          `INSERT INTO documents
           (id, content, source, embedding, document_id)
           VALUES ($1, $2, $3, $4::vector, $5)`,
          [
            uuidv4(),
            item.content,
            filename,
            JSON.stringify(item.embedding),
            documentId,
          ]
        );
      }

      await client.query('COMMIT');

      return {
        documentId,
        filename,
        chunks: chunks.length,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } finally {
    await parser.destroy();
  }
}

module.exports = { ingestDocument };
