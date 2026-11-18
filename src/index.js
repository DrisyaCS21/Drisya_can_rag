require('dotenv').config();

const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const multer = require('multer');
const helmet = require('helmet');

const { pool, initDb } = require('./db');
const { ingestDocument } = require('./ingest');
const { queryDocuments } = require('./query');

const { requireAuth } = require('./middleware/authMiddleware');
const authRoutes = require('./routes/authRoutes');

const app = express();

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET is missing from .env');
}

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(helmet());

app.use(express.json({ limit: '20kb' }));


app.use(
  session({
    name: 'documind.sid',
    store: new pgSession({
      pool,
      tableName: 'user_sessions',
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

// Authentication endpoints
app.use('/auth', authRoutes);

// PDF upload configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, callback) => {
    const isPdf =
      file.mimetype === 'application/pdf' &&
      file.originalname.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      return callback(new Error('Only PDF files are supported.'));
    }

    callback(null, true);
  },
});

// Upload PDF - login required
app.post(
  '/ingest',
  requireAuth,
  upload.single('file'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        error: 'Please select a PDF file.',
      });
    }

    // Check PDF signature, not only the supplied MIME type.
    if (req.file.buffer.subarray(0, 5).toString() !== '%PDF-') {
      return res.status(400).json({
        error: 'The uploaded file is not a valid PDF.',
      });
    }

    try {
      const result = await ingestDocument(
        req.file.buffer,
        req.file.originalname,
        req.user.id
      );

      res.status(201).json({
        message: 'Document uploaded successfully.',
        ...result,
      });
    } catch (error) {
      console.error('Ingestion error:', error);

      res.status(500).json({
        error: error.message || 'Document ingestion failed.',
      });
    }
  }
);

// Get logged-in user's documents
app.get('/documents', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, filename, created_at
       FROM uploaded_documents
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json({ documents: rows });
  } catch (error) {
    console.error('Document listing error:', error);

    res.status(500).json({
      error: 'Unable to retrieve documents.',
    });
  }
});

// Delete a document belonging to the logged-in user
app.delete('/documents/:id', requireAuth, async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM uploaded_documents
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (rowCount === 0) {
      return res.status(404).json({
        error: 'Document not found.',
      });
    }

    res.json({
      message: 'Document deleted successfully.',
    });
  } catch (error) {
    console.error('Document deletion error:', error);

    res.status(500).json({
      error: 'Unable to delete document.',
    });
  }
});

// Chat - login and document ownership required
app.post('/chat', requireAuth, async (req, res) => {
  const { question, documentId } = req.body;

  if (!question || typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({
      error: 'A question is required.',
    });
  }

  if (question.length > 4000) {
    return res.status(400).json({
      error: 'Question is too long.',
    });
  }

  const validUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!documentId || !validUuid.test(documentId)) {
    return res.status(400).json({
      error: 'Please select a valid document.',
    });
  }

  try {
    const result = await queryDocuments(
      question.trim(),
      documentId,
      req.user.id
    );

    res.json(result);
  } catch (error) {
    console.error('Chat error:', error);

    res.status(500).json({
      error: 'Unable to generate an answer.',
    });
  }
});

// Multer and other request errors
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      error:
        error.code === 'LIMIT_FILE_SIZE'
          ? 'PDF must be 10 MB or smaller.'
          : 'File upload failed.',
    });
  }

  if (error) {
    return res.status(400).json({
      error: error.message || 'Request failed.',
    });
  }

  next();
});

const PORT = process.env.PORT || 3000;

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`DocuMind API running on port ${PORT}`);
    });
  })
  .catch(error => {
    console.error('Database initialization failed:', error);
    process.exit(1);
  });
