
import { useEffect, useRef, useState } from 'react';

import './App.css';

import Login from './components/Login.jsx';
import Register from './components/Register.jsx';

import { useAuth } from './context/AuthContext.jsx';
import { apiFetch } from './services/api.js';

function App() {
  const { user, loading: authLoading, logout } = useAuth();

  const [authMode, setAuthMode] = useState('login');

  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');

  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!user) {
      setDocuments([]);
      setSelectedDocument(null);
      setMessages([]);
      return;
    }

    loadDocuments();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages, loading]);

  async function loadDocuments() {
    try {
      const data = await apiFetch('/api/documents');

      setDocuments(data.documents);

      setSelectedDocument(current => {
        if (!current) return null;

        return data.documents.find(
          doc => doc.id === current.id
        ) || null;
      });
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUpload(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setError('');
    setUploadMessage('');

    if (file.type !== 'application/pdf') {
      setError('Please select a PDF file.');
      event.target.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('PDF must be 10 MB or smaller.');
      event.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);

    try {
      const data = await apiFetch('/api/ingest', {
        method: 'POST',
        body: formData,
      });

      await loadDocuments();

      const newDocument = {
        id: data.documentId,
        filename: data.filename,
      };

      setSelectedDocument(newDocument);
      setMessages([]);

      setUploadMessage(
        `${file.name} uploaded successfully.`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }

  async function handleChat(event) {
    event.preventDefault();

    const userQuestion = question.trim();

    if (!userQuestion || !selectedDocument || loading) {
      return;
    }

    setMessages(previous => [
      ...previous,
      {
        role: 'user',
        content: userQuestion,
      },
    ]);

    setQuestion('');
    setLoading(true);
    setError('');

    try {
      const data = await apiFetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          question: userQuestion,
          documentId: selectedDocument.id,
        }),
      });

      setMessages(previous => [
        ...previous,
        {
          role: 'assistant',
          content: data.answer,
          sources: data.sources || [],
          similarity: data.topSimilarity,
        },
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleNewChat() {
    setMessages([]);
    setQuestion('');
    setError('');
  }

  async function handleDeleteDocument(documentId) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this document?'
    );

    if (!confirmed) return;

    try {
      await apiFetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (selectedDocument?.id === documentId) {
        setSelectedDocument(null);
        setMessages([]);
      }

      await loadDocuments();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleLogout() {
    try {
      await logout();
    } catch (err) {
      setError(err.message);
    }
  }

  if (authLoading) {
    return (
      <div className="auth-loading">
        <div className="auth-logo">✳</div>
        <p>Loading DocuMind...</p>
      </div>
    );
  }

  if (!user) {
    return authMode === 'login' ? (
      <Login onSwitch={() => setAuthMode('register')} />
    ) : (
      <Register onSwitch={() => setAuthMode('login')} />
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">✳</div>

          <div>
            <h2>DocuMind</h2>
            <span>AI DOCUMENT ASSISTANT</span>
          </div>
        </div>

        <button
          className="new-chat-btn"
          onClick={handleNewChat}
        >
          <span>＋</span> New conversation
        </button>

        <button
          className="upload-sidebar-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          ＋ Add PDF
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleUpload}
          hidden
        />

        <div className="sidebar-section">
          <p className="section-label">YOUR DOCUMENTS</p>

          {documents.length === 0 ? (
            <p className="empty-document">
              No documents uploaded yet.
            </p>
          ) : (
            <div className="document-list">
              {documents.map(document => (
                <div
                  className={`document-list-item ${
                    selectedDocument?.id === document.id
                      ? 'selected'
                      : ''
                  }`}
                  key={document.id}
                >
                  <button
                    className="document-select"
                    onClick={() => {
                      setSelectedDocument(document);
                      setMessages([]);
                      setError('');
                    }}
                  >
                    <span className="pdf-icon">PDF</span>

                    <span className="document-info">
                      <strong>{document.filename}</strong>
                      <span>Indexed successfully</span>
                    </span>
                  </button>

                  <button
                    className="delete-document-btn"
                    title="Delete document"
                    onClick={() => handleDeleteDocument(document.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sidebar-footer account-section">
          <div className="account-email">
            {user.email}
          </div>

          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            <span>↪</span> Log out
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <span className="breadcrumb">Workspace / </span>
            <strong>Document Chat</strong>
          </div>

          <div className="ai-status">
            <span className="status-dot"></span>
            AI Assistant
          </div>
        </header>

        <section className="workspace">
          {!selectedDocument ? (
            <div className="welcome">
              <div className="welcome-icon">✳</div>

              <p className="eyebrow">
                YOUR PERSONAL KNOWLEDGE ASSISTANT
              </p>

              <h1>
                Your documents,
                <br />
                <span>now conversational.</span>
              </h1>

              <p className="welcome-description">
                Upload a PDF, ask questions, and get intelligent
                answers based on the information inside your documents.
              </p>

              <div className="upload-card">
                <div className="upload-icon">↑</div>

                <h3>Upload your document</h3>

                <p>Select a PDF document to get started.</p>

                <button
                  className="select-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  Choose PDF
                </button>

                {uploading && (
                  <p className="success-message">
                    Processing your document...
                  </p>
                )}

                {uploadMessage && (
                  <p className="success-message">
                    ✓ {uploadMessage}
                  </p>
                )}
              </div>

              <div className="suggestions">
                <span>WHAT YOU CAN DO</span>

                <div className="suggestion-list">
                  <div>✧ Summarize documents</div>
                  <div>✧ Find specific information</div>
                  <div>✧ Ask questions in natural language</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="chat-container">
              <div className="chat-heading">
                <div>
                  <span className="eyebrow">
                    DOCUMENT CONVERSATION
                  </span>

                  <h2>Ask your document</h2>

                  <p className="active-document-name">
                    📄 {selectedDocument.filename}
                  </p>
                </div>

                <button
                  className="clear-btn"
                  onClick={handleNewChat}
                >
                  Clear chat
                </button>
              </div>

              {messages.length === 0 && !loading && (
                <div className="chat-empty">
                  <div className="welcome-icon">✳</div>
                  <h3>Your document is ready.</h3>
                  <p>
                    Ask a question about {selectedDocument.filename}.
                  </p>
                </div>
              )}

              {messages.map((message, index) => (
                <div
                  className={`message-row ${message.role}`}
                  key={index}
                >
                  <div className="message-avatar">
                    {message.role === 'user' ? 'You' : '✳'}
                  </div>

                  <div className="message-content">
                    <strong>
                      {message.role === 'user' ? 'You' : 'DocuMind'}
                    </strong>

                    <p>{message.content}</p>

                    {message.sources?.length > 0 && (
                      <div className="sources">
                        <span>Sources</span>

                        {message.sources.map((source, i) => (
                          <div className="source-item" key={i}>
                            📄 {source}
                          </div>
                        ))}
                      </div>
                    )}

                    {message.similarity && (
                      <div className="similarity">
                        Retrieval similarity: {message.similarity}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="loading-message">
                  <div className="message-avatar">✳</div>
                  <div>
                    <strong>DocuMind is thinking...</strong>
                    <div className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef}></div>
            </div>
          )}

          {error && (
            <div className="error-message">
              ⚠ {error}
              <button onClick={() => setError('')}>×</button>
            </div>
          )}

          <div className="composer-area">
            <form className="composer" onSubmit={handleChat}>
              <input
                type="text"
                placeholder={
                  selectedDocument
                    ? 'Ask anything about your document...'
                    : 'Upload a PDF to start asking questions...'
                }
                value={question}
                onChange={event => setQuestion(event.target.value)}
                disabled={!selectedDocument || loading}
              />

              <button
                type="submit"
                disabled={
                  !selectedDocument ||
                  !question.trim() ||
                  loading
                }
                aria-label="Send message"
              >
                ↑
              </button>
            </form>

            <p className="composer-note">
              AI-generated answers may contain mistakes.
              Verify important information.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
