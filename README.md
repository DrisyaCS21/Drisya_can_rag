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

[To be completed]

## Environment Variables

[Add required environment variables here. Never include actual API keys or passwords.]

## API Documentation

[Document the available endpoints, request formats, and responses.]

## Troubleshooting

[Document errors encountered during development and their solutions.]

## What I Learned

[Write about the concepts, tools, and technical challenges you learned while building this project.]

## Future Improvements

- Build a dedicated frontend interface.
- Support additional document formats.
- Improve document retrieval and ranking.
- Add conversation history.
- Improve error handling and input validation.

## Acknowledgements

This project was built as a learning project following the [freeCodeCamp RAG Chatbot tutorial](https://www.freecodecamp.org/news/how-to-build-rag-chatbot-nodejs-gemini-pgvector/).

Additional implementation changes and troubleshooting were carried out during development.