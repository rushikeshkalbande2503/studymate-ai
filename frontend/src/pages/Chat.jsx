
import { useEffect, useRef, useState } from "react";

import {
  FileText,
  Send,
  Bot,
  User,
  Sparkles,
  MessageSquare,
  RefreshCw,
  AlertCircle,
  Trash2,
  Cpu,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getDocuments, chatWithPDF } from "../services/api";

function Chat() {
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState("");

  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");

  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [sending, setSending] = useState(false);

  const [error, setError] = useState("");

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // ----------------------------------
  // LOAD DOCUMENTS
  // ----------------------------------

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setLoadingDocuments(true);

        const data = await getDocuments();

        const list = Array.isArray(data)
          ? data
          : data.documents || [];

        setDocuments(list);

        if (list.length > 0) {
          setSelectedDocument(String(list[0].id));
        }
      } catch (err) {
        console.error("Document loading error:", err);

        setError(
          err.response?.data?.detail ||
          "Unable to load your documents."
        );
      } finally {
        setLoadingDocuments(false);
      }
    };

    loadDocuments();
  }, []);

  // ----------------------------------
  // AUTO SCROLL
  // ----------------------------------

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, sending]);

  // ----------------------------------
  // CLEAR CHAT
  // ----------------------------------

  const handleClearChat = () => {
    if (sending) return;

    setMessages([]);
    setError("");
    setQuestion("");
  };

  // ----------------------------------
  // CHANGE DOCUMENT
  // ----------------------------------

  const handleDocumentChange = (event) => {
    setSelectedDocument(event.target.value);

    // Conversation context belongs to the selected PDF.
    setMessages([]);
    setError("");
    setQuestion("");
  };

  // ----------------------------------
  // SEND MESSAGE
  // ----------------------------------

  const handleSendMessage = async (event) => {
    event?.preventDefault();

    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      setError("Please enter a question.");
      return;
    }

    if (!selectedDocument) {
      setError("Please select a PDF document.");
      return;
    }

    if (sending) return;

    const userMessage = {
      role: "user",
      content: trimmedQuestion,
      localId: Date.now(),
    };

    // Only send successfully completed previous exchanges.
    const previousHistory = messages
      .filter((message) => !message.pending)
      .map((message) => ({
        role: message.role,
        content: message.content,
      }));

    setMessages((previous) => [
      ...previous,
      userMessage,
    ]);

    setQuestion("");
    setError("");
    setSending(true);

    try {
      const result = await chatWithPDF(
        Number(selectedDocument),
        trimmedQuestion,
        previousHistory
      );

      if (!result || !result.answer) {
        throw new Error("AI returned an empty response.");
      }

      const assistantMessage = {
        role: "assistant",
        content: result.answer,
        provider: result.provider,
        model: result.model,
        activityId: result.activity_id,
        createdAt: result.created_at,
      };

      setMessages((previous) => [
        ...previous,
        assistantMessage,
      ]);

    } catch (err) {
      console.error("Chat error:", err);

      setError(
        err.response?.data?.detail ||
        err.message ||
        "Unable to get an answer. Please try again."
      );

      // Remove the failed user message so it is not
      // included in the next conversation request.
      setMessages((previous) =>
        previous.filter(
          (message) => message.localId !== userMessage.localId
        )
      );

      setQuestion(trimmedQuestion);

    } finally {
      setSending(false);
    }
  };

  // ----------------------------------
  // SELECTED DOCUMENT
  // ----------------------------------

  const selectedDocumentDetails = documents.find(
    (doc) => String(doc.id) === String(selectedDocument)
  );

  // ----------------------------------
  // UI
  // ----------------------------------

  return (
    <div className="dashboard-container chat-page">

      {/* HEADER */}

      <section className="section-heading">
        <div>
          <h2>Chat with PDF</h2>
          <p>
            Ask questions and learn directly from your study material.
          </p>
        </div>

        <div className="chat-ai-label">
          <Sparkles size={15} />
          AI POWERED
        </div>
      </section>

      {/* CHAT INTRO */}

      <section className="chat-intro">
        <div className="chat-intro-icon">
          <MessageSquare size={34} />
        </div>

        <div>
          <h2>Your Personal AI Study Assistant</h2>
          <p>
            Select a PDF, ask questions and receive
            document-grounded explanations.
          </p>
        </div>
      </section>

      {/* DOCUMENT SELECTOR */}

      <section className="chat-document-selector">

        <div className="chat-document-label">
          <FileText size={17} />
          <label htmlFor="chat-document">
            Select Study Document
          </label>
        </div>

        {loadingDocuments ? (
          <p className="chat-muted">
            Loading documents...
          </p>
        ) : documents.length === 0 ? (
          <div className="chat-empty">
            <FileText size={30} />
            <h3>No Documents Available</h3>
            <p>
              Upload a PDF from your Dashboard to start chatting.
            </p>
          </div>
        ) : (
          <>
            <select
              id="chat-document"
              value={selectedDocument}
              onChange={handleDocumentChange}
              disabled={sending}
            >
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.filename} (ID: {doc.id})
                </option>
              ))}
            </select>

            {selectedDocumentDetails && (
              <div className="chat-selected-document">
                <FileText size={13} />
                {selectedDocumentDetails.filename}
              </div>
            )}
          </>
        )}

      </section>

      {/* CHAT WINDOW */}

      <section className="chat-window">

        {/* CHAT HEADER */}

        <div className="chat-window-header">

          <div className="chat-window-title">
            <div className="chat-bot-avatar">
              <Bot size={21} />
            </div>

            <div>
              <h3>StudyMate Assistant</h3>
              <span>
                {selectedDocumentDetails
                  ? `Reading ${selectedDocumentDetails.filename}`
                  : "Waiting for a document"}
              </span>
            </div>
          </div>

          <button
            className="chat-clear-button"
            onClick={handleClearChat}
            disabled={sending || messages.length === 0}
            title="Clear conversation"
          >
            <Trash2 size={15} />
            Clear Chat
          </button>

        </div>

        {/* MESSAGES */}

        <div className="chat-messages">

          {messages.length === 0 ? (
            <div className="chat-welcome">

              <div className="chat-welcome-icon">
                <Sparkles size={34} />
              </div>

              <h2>How can I help you study?</h2>

              <p>
                Ask anything about your selected PDF.
                I'll use its content to prepare an answer.
              </p>

              <div className="chat-suggestions">

                <button
                  type="button"
                  onClick={() =>
                    setQuestion("Explain the important topics in this PDF.")
                  }
                >
                  Explain important topics
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setQuestion("Give me important exam preparation points.")
                  }
                >
                  Exam preparation points
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setQuestion("Explain the difficult concepts in simple language.")
                  }
                >
                  Explain in simple language
                </button>

              </div>

            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={message.localId || message.activityId || index}
                className={`chat-message ${
                  message.role === "user"
                    ? "chat-user-message"
                    : "chat-assistant-message"
                }`}
              >

                <div className="chat-message-avatar">
                  {message.role === "user" ? (
                    <User size={18} />
                  ) : (
                    <Bot size={18} />
                  )}
                </div>

                <div className="chat-message-body">

                  <span className="chat-message-author">
                    {message.role === "user"
                      ? "You"
                      : "StudyMate AI"}
                  </span>

                  <div className="chat-message-content">
                    {message.role === "assistant" ? (
                      <div className="chat-markdown">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p>{message.content}</p>
                    )}
                  </div>

                  {message.role === "assistant" &&
                    message.provider && (
                      <div className="chat-provider-info">
                        <Cpu size={12} />
                        {message.provider} · {message.model}
                      </div>
                    )}

                </div>

              </div>
            ))
          )}

          {/* AI THINKING INDICATOR */}

          {sending && (
            <div className="chat-thinking">

              <div className="chat-message-avatar">
                <Bot size={18} />
              </div>

              <div>
                <span>StudyMate AI is thinking...</span>

                <div className="chat-thinking-dots">
                  <span />
                  <span />
                  <span />
                </div>
              </div>

            </div>
          )}

          <div ref={messagesEndRef} />

        </div>

        {/* ERROR */}

        {error && (
          <div className="chat-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* MESSAGE INPUT */}

        <form
          className="chat-input-area"
          onSubmit={handleSendMessage}
        >

          <textarea
            ref={textareaRef}
            value={question}
            onChange={(event) =>
              setQuestion(event.target.value)
            }
            placeholder="Ask a question about your PDF..."
            rows={2}
            maxLength={4000}
            disabled={
              sending ||
              !selectedDocument ||
              documents.length === 0
            }
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey
              ) {
                event.preventDefault();
                handleSendMessage(event);
              }
            }}
          />

          <button
            type="submit"
            className="chat-send-button"
            disabled={
              sending ||
              !question.trim() ||
              !selectedDocument
            }
          >
            {sending ? (
              <RefreshCw
                size={18}
                className="summary-spinner"
              />
            ) : (
              <Send size={18} />
            )}

            <span>{sending ? "Sending..." : "Send"}</span>
          </button>

        </form>

        <div className="chat-input-footer">
          <span>
            Enter to send · Shift + Enter for new line
          </span>

          <span>
            {question.length}/4000
          </span>
        </div>

      </section>

      <div className="chat-disclaimer">
        <AlertCircle size={13} />
        AI-generated answers may contain errors.
        Verify important academic information.
      </div>

    </div>
  );
}

export default Chat;
