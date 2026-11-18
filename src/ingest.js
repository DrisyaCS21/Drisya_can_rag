
const { PDFParse } = require('pdf-parse');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('./db');
const { embedText } = require('./embeddings');


function chunkText(text, chunkSize = 1200, overlap = 180) {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean);

  const chunks = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    // Keep reasonably sized paragraphs together.
    if (paragraph.length > chunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = '';
      }

      // Split unusually long paragraphs into smaller pieces.
      let start = 0;

      while (start < paragraph.length) {
        const end = Math.min(start + chunkSize, paragraph.length);

        const piece = paragraph.slice(start, end).trim();

        if (piece.length > 50) {
          chunks.push(piece);
        }

        start += chunkSize - overlap;
      }

      continue;
    }

    if (
      currentChunk &&
      currentChunk.length + paragraph.length + 2 > chunkSize
    ) {
      chunks.push(currentChunk);

      // Preserve some context from the previous chunk.
      currentChunk = currentChunk.slice(-overlap);
    }

    currentChunk = currentChunk
      ? `${currentChunk}\n\n${paragraph}`
      : paragraph;
  }

  if (currentChunk.trim().length > 50) {
    chunks.push(currentChunk.trim());
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
