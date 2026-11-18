# Drisya_can_rag

# RAG Chatbot with Node.js, Gemini & PostgreSQL

A Retrieval-Augmented Generation (RAG) chatbot built using Node.js, Express, Google Gemini embeddings, Groq, PostgreSQL, and pgvector.

This application allows users to upload PDF documents and ask questions about their contents. Instead of relying entirely on the language model's pre-trained knowledge, the application retrieves relevant information from the uploaded documents and uses that information to generate contextual answers.

## About the Project

The purpose of this project is to explore how Retrieval-Augmented Generation (RAG) works and how Large Language Models (LLMs) can be integrated into a backend application.

The application follows two main processes:

- **Document Ingestion:** Extracting text from uploaded PDF files, splitting the content into smaller chunks, generating embeddings, and storing them in a PostgreSQL database.
- **Question Answering:** Converting a user's question into an embedding, retrieving relevant document chunks using vector similarity search, and passing the retrieved context to an LLM to generate an answer.

## Key Features

- PDF document upload
- Automatic text extraction
- Text chunking with overlapping sections
- Vector embedding generation
- PostgreSQL vector storage using pgvector
- Semantic similarity search
- AI-generated answers based on retrieved document context
- REST API endpoints for document ingestion and chat

## Technologies Used

- Node.js
- Express.js
- Google Gemini API (Embeddings)
- Groq API (Text Generation)
- PostgreSQL
- pgvector
- Docker
- JavaScript
- pdf-parse

## Project Architecture

The application consists of two main pipelines:

1. Document Ingestion Pipeline
2. Query and Retrieval Pipeline

[Add architecture diagram here]

## Installation and Setup

Create the project directory and initialize it:
-mkdir nodejs-rag-chatbot
-cd nodejs-rag-chatbot
-npm init -y

Install dependencies:
-npm install express pg pdf-parse uuid dotenv multer
-npm install --save-dev nodemon

A quick note on the packages: multer is what makes file uploads work on the /ingest endpoint. Without it, Express can't parse multipart form data.

pdf-parse does the heavy lifting on PDFs, though watch out for scanned PDFs. Those are just images with no text layer underneath, so you'll get back an empty string.

pg talks to Postgres, uuid gives each row a unique ID, and dotenv loads your keys before the app does anything.

## Environment Variables
Create a .env in the project root. It needs seven values:

-GEMINI_API_KEY=AIzaSy...        ← your Gemini key from -Google AI Studio
-GROQ_API_KEY=gsk_...            ← your Groq key from -console.groq.com
-POSTGRES_USER=rag_user
-POSTGRES_PASSWORD=rag_pass      ← choose any password,this is local only
-POSTGRES_DB=rag_db
-DATABASE_URL=postgresql://rag_user:rag_pass@localhost:5432/rag_db
-PORT=3000


## API Documentation
[to be written]


## Troubleshooting
[to be written]


## What I Learned

During building these projects, i got to learn about the imapcts of open ai and the system prompt , ingestions and embedding on how the technology is used to connect the LLM and get the required resposne.

## Future Improvements

- Build a dedicated frontend interface.
- Support additional document formats.
- Improve document retrieval and ranking.
- Add conversation history.
- Improve error handling and input validation.

## Acknowledgements

This project was built as a learning project following the [freeCodeCamp RAG Chatbot tutorial](https://www.freecodecamp.org/news/how-to-build-rag-chatbot-nodejs-gemini-pgvector/).

Additional implementation changes and troubleshooting were carried out during development.