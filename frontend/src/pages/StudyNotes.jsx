
import { useEffect, useState } from "react";
import {
  BookOpen,
  Brain,
  FileText,
  Loader2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Eye,
  Download,
  Clock,
  CheckCircle,
} from "lucide-react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  getDocuments,
  generateStudyNotes,
  getStudyNotesHistory,
  deleteActivity,
} from "../services/api";

export default function StudyNotes() {
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState("");

  const [notes, setNotes] = useState(null);
  const [history, setHistory] = useState([]);

  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadDocuments();
    loadHistory();
  }, []);

  // ==========================================
  // LOAD DOCUMENTS
  // ==========================================

  const loadDocuments = async () => {
    try {
      setLoadingDocuments(true);

      const response = await getDocuments();

      const docs = Array.isArray(response)
        ? response
        : response.documents || [];

      setDocuments(docs);

      if (docs.length > 0) {
        setSelectedDocument(String(docs[0].id));
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to load uploaded documents."
      );
    } finally {
      setLoadingDocuments(false);
    }
  };

  // ==========================================
  // LOAD SAVED NOTES HISTORY
  // ==========================================

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);

      const response = await getStudyNotesHistory();

      setHistory(response);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to load study notes history."
      );
    } finally {
      setLoadingHistory(false);
    }
  };

  // ==========================================
  // GENERATE STUDY NOTES
  // ==========================================

  const handleGenerate = async () => {
    if (!selectedDocument) {
      setError("Please select a PDF document.");
      return;
    }

    try {
      setGenerating(true);
      setError("");
      setSuccess("");
      setNotes(null);

      const response = await generateStudyNotes(
        selectedDocument
      );

      setNotes({
        ...response,
        activity_id: response.activity_id,
      });

      setSuccess("Study notes generated successfully!");

      await loadHistory();

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to generate study notes. Please try again."
      );
    } finally {
      setGenerating(false);
    }
  };

  // ==========================================
  // VIEW SAVED NOTES
  // ==========================================

  const handleViewNotes = (activity) => {
    try {
      const data =
        typeof activity.result === "string"
          ? JSON.parse(activity.result)
          : activity.result || {};

      const document = documents.find(
        (doc) => doc.id === activity.document_id
      );

      setNotes({
        success: true,
        activity_id: activity.id,
        document_id: activity.document_id,
        filename:
          document?.filename ||
          `Document #${activity.document_id}`,
        notes: data.notes || "",
        provider: data.provider || "AI",
        model: data.model || "",
        created_at: activity.created_at,
      });

      setError("");
      setSuccess("");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch {
      setError("Unable to open saved study notes.");
    }
  };

  // ==========================================
  // DELETE SAVED NOTES
  // ==========================================

  const handleDelete = async (activityId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete these study notes?"
    );

    if (!confirmed) return;

    try {
      setError("");

      await deleteActivity(activityId);

      setHistory((previous) =>
        previous.filter((item) => item.id !== activityId)
      );

      if (notes?.activity_id === activityId) {
        setNotes(null);
      }

      setSuccess("Study notes deleted successfully.");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to delete study notes."
      );
    }
  };

  // ==========================================
  // EXPORT NOTES AS PDF
  // ==========================================

  const handleExportPDF = () => {
    if (!notes?.notes) return;

    document.body.classList.add("study-notes-print-mode");

    const cleanup = () => {
      document.body.classList.remove("study-notes-print-mode");
      window.removeEventListener("afterprint", cleanup);
    };

    window.addEventListener("afterprint", cleanup);

    window.print();

    // Fallback cleanup if the browser does not fire afterprint.
    setTimeout(cleanup, 2000);
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loadingDocuments) {
    return (
      <div className="study-notes-loading">
        <Loader2 size={30} className="spin" />
        <p>Loading your documents...</p>
      </div>
    );
  }

  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <div className="study-notes-page">

      {/* HEADER */}

      <div className="study-notes-header">
        <div className="study-notes-header-icon">
          <BookOpen size={26} />
        </div>

        <h1>AI Study Notes</h1>

        <p>
          Transform your uploaded PDFs into structured,
          exam-oriented study notes using AI.
        </p>
      </div>

      {/* ERROR */}

      {error && (
        <div className="study-notes-alert error">
          <AlertCircle size={18} />
          <span>{error}</span>

          <button onClick={() => setError("")}>×</button>
        </div>
      )}

      {/* SUCCESS */}

      {success && (
        <div className="study-notes-alert success">
          <CheckCircle size={18} />
          <span>{success}</span>

          <button onClick={() => setSuccess("")}>×</button>
        </div>
      )}

      {/* GENERATOR */}

      <div className="study-notes-generator">

        <div className="study-notes-section-heading">
          <Brain size={22} />
          <h2>Generate Study Notes</h2>
        </div>

        <div className="study-notes-form-group">
          <label>Select PDF Document</label>

          <select
            value={selectedDocument}
            onChange={(e) =>
              setSelectedDocument(e.target.value)
            }
            disabled={generating}
          >
            <option value="">Choose a document</option>

            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.filename}
              </option>
            ))}
          </select>
        </div>

        <button
          className="study-notes-generate-btn"
          onClick={handleGenerate}
          disabled={generating || documents.length === 0}
        >
          {generating ? (
            <>
              <Loader2 size={19} className="spin" />
              Generating Study Notes...
            </>
          ) : (
            <>
              <Brain size={19} />
              Generate AI Study Notes
            </>
          )}
        </button>

        {documents.length === 0 && (
          <p className="study-notes-empty">
            <FileText size={17} />
            Upload a PDF document first.
          </p>
        )}
      </div>

      {/* GENERATING STATUS */}

      {generating && (
        <div className="study-notes-generating">
          <Loader2 size={35} className="spin" />

          <h3>AI is preparing your study notes</h3>

          <p>
            Analyzing your PDF and organizing important topics.
            This may take a few moments.
          </p>
        </div>
      )}

      {/* GENERATED NOTES */}

      {notes && !generating && (
        <div className="study-notes-result">

          <div className="study-notes-result-header">
            <div>
              <span className="study-notes-label">
                GENERATED STUDY NOTES
              </span>

              <h2>{notes.filename}</h2>

              <p>
                Generated using {notes.provider}
                {notes.model ? ` · ${notes.model}` : ""}
              </p>
            </div>

            <button
              className="study-notes-export-btn"
              onClick={handleExportPDF}
            >
              <Download size={18} />
              Export PDF
            </button>
          </div>

          <div className="study-notes-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {notes.notes}
            </ReactMarkdown>
          </div>

          <div className="study-notes-result-footer">
            <span>
              <Clock size={15} />
              {notes.created_at
                ? new Date(notes.created_at).toLocaleString()
                : "Recently generated"}
            </span>

            <span>
              Activity #{notes.activity_id}
            </span>
          </div>

        </div>
      )}

      {/* PRINT-ONLY DOCUMENT */}

      {notes && (
        <div className="study-notes-print-document">

          <div className="study-notes-print-header">
            <h1>StudyMate AI</h1>

            <h2>Study Notes</h2>

            <p>
              <strong>Document:</strong> {notes.filename}
            </p>

            <p>
              <strong>AI Provider:</strong> {notes.provider}
            </p>

            <p>
              <strong>Generated:</strong>{" "}
              {notes.created_at
                ? new Date(notes.created_at).toLocaleString()
                : new Date().toLocaleString()}
            </p>
          </div>

          <div className="study-notes-print-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {notes.notes}
            </ReactMarkdown>
          </div>

          <p className="study-notes-print-footer">
            Generated by StudyMate AI
          </p>

        </div>
      )}

      {/* SAVED HISTORY */}

      <div className="study-notes-history">

        <div className="study-notes-history-header">
          <div>
            <h2>
              <FileText size={22} />
              Study Notes History
            </h2>

            <p>
              Access your previously generated study notes.
            </p>
          </div>

          <button
            onClick={loadHistory}
            disabled={loadingHistory}
            title="Refresh history"
          >
            <RefreshCw
              size={18}
              className={loadingHistory ? "spin" : ""}
            />
          </button>
        </div>

        {loadingHistory ? (
          <p className="study-notes-history-message">
            Loading saved notes...
          </p>
        ) : history.length === 0 ? (
          <div className="study-notes-history-empty">
            <FileText size={35} />

            <h3>No saved study notes</h3>

            <p>Generate your first set of study notes.</p>
          </div>
        ) : (
          <div className="study-notes-history-list">

            {history.map((item) => {
              const document = documents.find(
                (doc) => doc.id === item.document_id
              );

              return (
                <div
                  className="study-notes-history-card"
                  key={item.id}
                >
                  <div className="study-notes-history-details">

                    <div className="study-notes-history-icon">
                      <BookOpen size={21} />
                    </div>

                    <div>
                      <h3>
                        {document?.filename ||
                          `Document #${item.document_id}`}
                      </h3>

                      <p>
                        Notes Set #{item.id}
                      </p>

                      <small>
                        {item.created_at
                          ? new Date(
                              item.created_at
                            ).toLocaleString()
                          : "Date unavailable"}
                      </small>
                    </div>

                  </div>

                  <div className="study-notes-history-actions">

                    <button
                      onClick={() => handleViewNotes(item)}
                    >
                      <Eye size={16} />
                      View
                    </button>

                    <button
                      className="study-notes-delete-btn"
                      onClick={() => handleDelete(item.id)}
                      title="Delete notes"
                    >
                      <Trash2 size={17} />
                    </button>

                  </div>
                </div>
              );
            })}

          </div>
        )}

        <div className="study-notes-history-footer">
          Total saved notes: {history.length}
        </div>

      </div>
    </div>
  );
}
