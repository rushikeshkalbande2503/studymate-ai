
import { useEffect, useState, useCallback } from "react";
import {
  FileText,
  Trash2,
  RefreshCw,
  FolderOpen,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

import { getDocuments, deleteDocument } from "../services/api";

function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getDocuments();

      // Supports either a direct array or an object containing documents.
      const documentList = Array.isArray(data)
        ? data
        : data.documents || [];

      setDocuments(documentList);
    } catch (err) {
      console.error("Document loading error:", err);
      setError(
        err.response?.data?.detail ||
        "Unable to load documents. Please check your backend connection."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleDelete = async (documentId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this document? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      setDeletingId(documentId);
      setError("");
      setMessage("");

      await deleteDocument(documentId);

      setDocuments((previous) =>
        previous.filter((doc) => doc.id !== documentId)
      );

      setMessage("Document deleted successfully.");
    } catch (err) {
      console.error("Document deletion error:", err);
      setError(
        err.response?.data?.detail ||
        "Unable to delete this document."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "Date unavailable";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return "Date unavailable";

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="dashboard-container documents-page">
      <section className="section-heading">
        <div>
          <h2>My Documents</h2>
          <p>Manage all your uploaded study materials.</p>
        </div>

        <button
          className="primary-button"
          onClick={fetchDocuments}
          disabled={loading}
        >
          <RefreshCw size={14} />
          {loading ? "Loading..." : "Refresh"}
        </button>
      </section>

      <div className="documents-summary">
        <div className="document-summary-icon">
          <FolderOpen size={24} />
        </div>

        <div>
          <span>Total Uploaded Documents</span>
          <h2>{documents.length}</h2>
        </div>
      </div>

      {message && (
        <div className="documents-message success-message">
          <CheckCircle size={16} />
          {message}
        </div>
      )}

      {error && (
        <div className="documents-message error-message">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="documents-empty">
          <RefreshCw size={28} />
          <p>Loading your documents...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="documents-empty">
          <FolderOpen size={42} />
          <h3>No Documents Found</h3>
          <p>
            You have not uploaded any PDFs yet.
            Upload your first study material from the Dashboard.
          </p>
        </div>
      ) : (
        <div className="documents-list">
          {documents.map((doc) => (
            <div className="document-card" key={doc.id}>
              <div className="document-icon">
                <FileText size={25} />
              </div>

              <div className="document-details">
                <h3>{doc.filename || "Untitled Document"}</h3>

                <p>
                  Document ID: {doc.id}
                </p>

                <p>
                  Uploaded: {formatDate(doc.created_at)}
                </p>
              </div>

              <div className="document-actions">
                <span className="document-status">
                  <CheckCircle size={13} />
                  Uploaded
                </span>

                <button
                  className="delete-document-button"
                  onClick={() => handleDelete(doc.id)}
                  disabled={deletingId === doc.id}
                  title="Delete document"
                >
                  <Trash2 size={16} />
                  {deletingId === doc.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Documents;
