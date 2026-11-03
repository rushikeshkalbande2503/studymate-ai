
import { useCallback, useEffect, useRef, useState } from "react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  FileText,
  Sparkles,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Brain,
  Cpu,
  Calendar,
  History,
  Eye,
  Trash2,
  ArrowLeft,
  Search,
} from "lucide-react";

import {
  getDocuments,
  generateSummary,
  getActivities,
  deleteActivity,
} from "../services/api";

const ITEMS_PER_PAGE = 5;

function Summary() {
  // ----------------------------------
  // STATE MANAGEMENT
  // ----------------------------------

  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState("");

  const [summaryData, setSummaryData] = useState(null);
  const summaryResultRef = useRef(null);
  const [history, setHistory] = useState([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);

  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Search, filter and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [documentFilter, setDocumentFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // ----------------------------------
  // LOAD DOCUMENTS
  // ----------------------------------

  const fetchDocuments = useCallback(async () => {
    try {
      setLoadingDocuments(true);
      setError("");

      const data = await getDocuments();

      const documentList = Array.isArray(data)
        ? data
        : data.documents || [];

      setDocuments(documentList);

      if (documentList.length > 0) {
        setSelectedDocument((previous) => {
          const exists = documentList.some(
            (doc) => String(doc.id) === String(previous)
          );

          return exists
            ? previous
            : String(documentList[0].id);
        });
      } else {
        setSelectedDocument("");
      }
    } catch (err) {
      console.error("Document loading error:", err);

      setError(
        err.response?.data?.detail ||
        err.message ||
        "Unable to load documents."
      );
    } finally {
      setLoadingDocuments(false);
    }
  }, []);

  // ----------------------------------
  // LOAD SUMMARY HISTORY
  // ----------------------------------

 
const fetchHistory = useCallback(async () => {
  try {
    setLoadingHistory(true);

    const [activityData, documentData] = await Promise.all([
      getActivities(),
      getDocuments(),
    ]);

    const activityList = Array.isArray(activityData)
      ? activityData
      : activityData.activities || [];

    const documentList = Array.isArray(documentData)
      ? documentData
      : documentData.documents || [];

    const documentMap = new Map(
      documentList.map((doc) => [
        String(doc.id),
        doc.filename,
      ])
    );

    const summaryHistory = activityList
      .filter(
        (activity) =>
          activity.activity_type === "summary" &&
          typeof activity.result === "string"
      )
      .map((activity) => {
        let parsedResult = {};

        try {
          parsedResult = JSON.parse(activity.result);
        } catch (error) {
          console.error(
            "Unable to parse saved summary:",
            activity.id,
            error
          );
        }

        return {
          ...activity,
          filename:
            documentMap.get(String(activity.document_id)) ||
            `Document ${activity.document_id}`,
          summary: parsedResult.summary || "",
          provider: parsedResult.provider || "Not recorded",
          model: parsedResult.model || "Not recorded",
        };
      })
      .sort(
        (a, b) =>
          new Date(b.created_at) - new Date(a.created_at)
      );

    setHistory(summaryHistory);
  } catch (err) {
    console.error("History loading error:", err);

    setError(
      err.response?.data?.detail ||
        err.message ||
        "Unable to load summary history."
    );
  } finally {
    setLoadingHistory(false);
  }
}, []);

  // ----------------------------------
  // INITIAL DATA LOADING
  // ----------------------------------

  useEffect(() => {
    fetchDocuments();
    fetchHistory();
  }, [fetchDocuments, fetchHistory]);
  // AUTO SCROLL TO SUMMARY RESULT

useEffect(() => {
  if (summaryData && summaryResultRef.current) {
    summaryResultRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}, [summaryData]);

  // ----------------------------------
  // GENERATE NEW SUMMARY
  // ----------------------------------

  const handleGenerateSummary = async () => {
    if (!selectedDocument) {
      setError("Please select a PDF document first.");
      return;
    }

    if (generating) return;

    try {
      setGenerating(true);
      setError("");
      setMessage("");
      setSummaryData(null);
      setSelectedHistoryId(null);

      const result = await generateSummary(selectedDocument);

      if (!result || !result.summary) {
        throw new Error(
          "The backend returned an empty summary."
        );
      }

      setSummaryData({
        ...result,
        created_at:
          result.created_at || new Date().toISOString(),
      });

      setMessage("AI summary generated successfully.");

      // Refresh database history.
      await fetchHistory();

      setCurrentPage(1);
      setSearchTerm("");
      setDocumentFilter("all");

    } catch (err) {
      console.error("Summary generation error:", err);

      setError(
        err.response?.data?.detail ||
        err.message ||
        "Summary generation failed. Please try again."
      );
    } finally {
      setGenerating(false);
    }
  };

  // ----------------------------------
  // VIEW PREVIOUS SUMMARY
  // ----------------------------------

const handleViewHistory = (activity) => {
  if (!activity.summary) {
    setError(
      "This saved activity does not contain a readable summary."
    );
    return;
  }

  setSummaryData({
    document_id: activity.document_id,
    filename: activity.filename,
    summary: activity.summary,
    provider: activity.provider || "Not recorded",
    model: activity.model || "Not recorded",
    activity_id: activity.id,
    created_at: activity.created_at,
  });

  setSelectedDocument(String(activity.document_id));
  setSelectedHistoryId(activity.id);

  setError("");
  setMessage("Previous summary loaded from database.");
};

  // ----------------------------------
  // DELETE SUMMARY
  // ----------------------------------

  const handleDeleteHistory = async (activityId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this summary? This cannot be undone."
    );

    if (!confirmed) return;

    try {
      setDeletingId(activityId);
      setError("");
      setMessage("");

      await deleteActivity(activityId);

      setHistory((previous) =>
        previous.filter((item) => item.id !== activityId)
      );

      if (selectedHistoryId === activityId) {
        setSummaryData(null);
        setSelectedHistoryId(null);
      }

      setMessage("Summary history deleted successfully.");

    } catch (err) {
      console.error("Delete history error:", err);

      setError(
        err.response?.data?.detail ||
        err.message ||
        "Unable to delete summary history."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ----------------------------------
  // DATE FORMATTING
  // ----------------------------------

  const formatDate = (dateValue) => {
    if (!dateValue) return "Date unavailable";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Date unavailable";
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ----------------------------------
  // SEARCH AND DOCUMENT FILTERING
  // ----------------------------------

  const filteredHistory = history.filter((activity) => {
    const filename = (
      activity.filename || ""
    ).toLowerCase();

    const matchesSearch = filename.includes(
      searchTerm.trim().toLowerCase()
    );

    const matchesDocument =
      documentFilter === "all" ||
      String(activity.document_id) === documentFilter;

    return matchesSearch && matchesDocument;
  });

  // ----------------------------------
  // PAGINATION
  // ----------------------------------

  const totalPages = Math.ceil(
    filteredHistory.length / ITEMS_PER_PAGE
  );

  const safeCurrentPage = Math.min(
    currentPage,
    Math.max(totalPages, 1)
  );

  const startIndex =
    (safeCurrentPage - 1) * ITEMS_PER_PAGE;

  const paginatedHistory = filteredHistory.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  // ----------------------------------
  // SELECTED DOCUMENT DETAILS
  // ----------------------------------

  const selectedDocumentDetails = documents.find(
    (doc) => String(doc.id) === String(selectedDocument)
  );

  // ----------------------------------
  // UI
  // ----------------------------------

  return (
    <div className="dashboard-container summary-page">

      {/* PAGE HEADER */}

      <section className="section-heading">
        <div>
          <h2>AI PDF Summary</h2>
          <p>
            Transform your study material into
            exam-oriented summaries.
          </p>
        </div>

        <div className="summary-ai-label">
          <Sparkles size={15} />
          AI POWERED
        </div>
      </section>

      {/* INTRODUCTION */}

      <section className="summary-intro">
        <div className="summary-intro-icon">
          <Brain size={38} />
        </div>

        <div>
          <h2>Understand More. Study Smarter.</h2>
          <p>
            Select an uploaded PDF and let StudyMate AI
            extract important concepts, definitions
            and revision points.
          </p>
        </div>
      </section>

      {/* DOCUMENT SELECTOR */}

      <section className="summary-selector">

        <div className="summary-section-title">
          <FileText size={18} />
          <h3>Select Your Study Material</h3>
        </div>

        {loadingDocuments ? (
          <p className="summary-muted">
            Loading your documents...
          </p>
        ) : documents.length === 0 ? (
          <div className="summary-empty">
            <FileText size={30} />
            <h3>No PDFs Available</h3>
            <p>
              Upload a PDF from your Dashboard before
              generating a summary.
            </p>
          </div>
        ) : (
          <>
            <label htmlFor="summary-document">
              Choose uploaded PDF
            </label>

            <select
              id="summary-document"
              value={selectedDocument}
              disabled={generating}
              onChange={(event) => {
                setSelectedDocument(event.target.value);
                setSummaryData(null);
                setSelectedHistoryId(null);
                setError("");
                setMessage("");
              }}
            >
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.filename} (ID: {doc.id})
                </option>
              ))}
            </select>

            {selectedDocumentDetails && (
              <div className="summary-document-info">
                <FileText size={14} />
                <span>
                  Selected: {selectedDocumentDetails.filename}
                </span>
              </div>
            )}

            <button
              className="primary-button summary-generate-button"
              onClick={handleGenerateSummary}
              disabled={generating || !selectedDocument}
            >
              {generating ? (
                <>
                  <RefreshCw
                    size={17}
                    className="summary-spinner"
                  />
                  Generating Summary...
                </>
              ) : (
                <>
                  <Sparkles size={17} />
                  Generate AI Summary
                </>
              )}
            </button>
          </>
        )}
      </section>

      {/* ALERTS */}

      {error && (
        <div className="summary-alert summary-error">
          <AlertCircle size={17} />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="summary-alert summary-success">
          <CheckCircle size={17} />
          <span>{message}</span>
        </div>
      )}

      {/* GENERATION LOADING */}

      {generating && (
        <div className="summary-loading">
          <div className="summary-loading-icon">
            <Brain size={32} />
          </div>

          <h3>Analyzing Your Study Material</h3>

          <p>
            StudyMate AI is processing your PDF and
            preparing an exam-oriented summary.
            Please wait.
          </p>
        </div>
      )}

      {/* SUMMARY HISTORY */}

      <section className="summary-history">

        <div className="summary-history-heading">

          <div>
            <History size={19} />
            <h3>Summary History</h3>
          </div>

          <button
            className="summary-refresh-button"
            onClick={() => {
              fetchHistory();
              fetchDocuments();
            }}
            disabled={loadingHistory}
          >
            <RefreshCw
              size={14}
              className={
                loadingHistory ? "summary-spinner" : ""
              }
            />
            Refresh
          </button>

        </div>

        {/* SEARCH AND FILTER */}

        <div className="summary-history-filters">

          <div className="summary-search-box">
            <Search size={16} />

            <input
              type="text"
              placeholder="Search by PDF filename..."
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <select
            className="summary-filter-select"
            value={documentFilter}
            onChange={(event) => {
              setDocumentFilter(event.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Documents</option>

            {documents.map((doc) => (
              <option
                key={doc.id}
                value={String(doc.id)}
              >
                {doc.filename}
              </option>
            ))}
          </select>

        </div>

        {/* HISTORY RECORDS */}

        {loadingHistory ? (
          <p className="summary-muted">
            Loading summary history...
          </p>
        ) : history.length === 0 ? (
          <div className="summary-history-empty">
            <History size={30} />
            <p>No previous summaries found.</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="summary-history-empty">
            <Search size={30} />
            <p>
              No summaries match your search or filter.
            </p>
          </div>
        ) : (
          <>
            <div className="summary-history-list">

              {paginatedHistory.map((activity) => (
                <div
                  className={`summary-history-card ${
                    selectedHistoryId === activity.id
                      ? "summary-history-active"
                      : ""
                  }`}
                  key={activity.id}
                >

                  <div className="summary-history-icon">
                    <FileText size={21} />
                  </div>

                  <div className="summary-history-details">

                    <h4>{activity.filename}</h4>

                    <p>
                      Activity ID: {activity.id}
                    </p>

                    <p>
                      <Calendar size={12} />
                      {formatDate(activity.created_at)}
                    </p>

                    {activity.provider && (
                      <p>
                        AI Provider: {activity.provider}
                      </p>
                    )}

                  </div>

                  <div className="summary-history-actions">

                    <button
                      className="summary-view-button"
                      onClick={() => handleViewHistory(activity)}
                      title="View previous summary"
                    >
                      <Eye size={15} />
                      View
                    </button>

                    <button
                      className="summary-delete-button"
                      onClick={() =>
                        handleDeleteHistory(activity.id)
                      }
                      disabled={deletingId === activity.id}
                      title="Delete summary"
                    >
                      <Trash2 size={15} />
                      {deletingId === activity.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>

                  </div>

                </div>
              ))}

            </div>

            {/* PAGINATION */}

            <div className="summary-pagination">

              <span>
                Showing {startIndex + 1}–
                {Math.min(
                  startIndex + ITEMS_PER_PAGE,
                  filteredHistory.length
                )} of {filteredHistory.length} summaries
              </span>

              <div className="summary-pagination-buttons">

                <button
                  disabled={safeCurrentPage === 1}
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.max(1, page - 1)
                    )
                  }
                >
                  Previous
                </button>

                <span>
                  Page {safeCurrentPage} of {totalPages}
                </span>

                <button
                  disabled={safeCurrentPage >= totalPages}
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(totalPages, page + 1)
                    )
                  }
                >
                  Next
                </button>

              </div>

            </div>

          </>
        )}

      </section>

      {/* GENERATED OR PREVIOUS SUMMARY */}

      {summaryData && !generating && (
        <section className="summary-result" ref={summaryResultRef}>

          <div className="summary-result-header">

            <div>
              <span className="summary-result-label">
                {selectedHistoryId
                  ? "PREVIOUSLY GENERATED SUMMARY"
                  : "GENERATED AI SUMMARY"}
              </span>

              <h2>{summaryData.filename}</h2>
            </div>

            <div className="summary-provider">
              <Cpu size={15} />
              {summaryData.provider || "Not recorded"}
            </div>

          </div>

          <div className="summary-model-info">

            <span>
              AI Provider: {summaryData.provider || "Not recorded"}
            </span>

            <span>
              Model: {summaryData.model || "Not recorded"}
            </span>

            <span>
              Activity ID: {summaryData.activity_id || "N/A"}
            </span>

          </div>

          <div className="summary-date">
            <Calendar size={14} />
            Generated: {formatDate(summaryData.created_at)}
          </div>

          <div className="summary-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {summaryData.summary}
            </ReactMarkdown>
          </div>

          <button
            className="primary-button summary-back-button"
            onClick={() => {
              setSummaryData(null);
              setSelectedHistoryId(null);
              setMessage("");
            }}
          >
            <ArrowLeft size={16} />
            Back to Summary History
          </button>

          {!selectedHistoryId && (
            <p className="summary-regenerate-note">
              This summary has been saved in your database.
            </p>
          )}

        </section>
      )}

    </div>
  );
}

export default Summary;
