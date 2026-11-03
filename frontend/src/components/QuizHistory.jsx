
import { useEffect, useState } from "react";
import {
  History,
  Eye,
  Trash2,
  FileText,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  CheckCircle,
} from "lucide-react";

import { getActivities, deleteActivity } from "../services/api";

export default function QuizHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getActivities();

      const activities = Array.isArray(response)
        ? response
        : response.activities || [];

      const quizzes = activities
        .filter((item) => item.activity_type === "quiz")
        .map((item) => {
          let result = {};

          try {
            result =
              typeof item.result === "string"
                ? JSON.parse(item.result)
                : item.result || {};
          } catch {
            result = {};
          }

          return { ...item, quizData: result };
        });

      setHistory(quizzes);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to load quiz history."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDelete = async (activityId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this quiz history?"
    );

    if (!confirmed) return;

    try {
      await deleteActivity(activityId);

      setHistory((previous) =>
        previous.filter((item) => item.id !== activityId)
      );

      if (expandedId === activityId) {
        setExpandedId(null);
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to delete quiz history."
      );
    }
  };

  const filteredHistory = history.filter((item) => {
    const filename = item.filename || "";
    const difficulty = item.quizData?.difficulty || "";

    const query = search.toLowerCase();

    return (
      filename.toLowerCase().includes(query) ||
      difficulty.toLowerCase().includes(query) ||
      String(item.id).includes(query)
    );
  });

  return (
    <section className="quiz-history-section">

      <div className="quiz-history-header">
        <div>
          <div className="quiz-history-title">
            <History size={21} />
            <h2>Quiz History</h2>
          </div>

          <p>View your previously generated quizzes.</p>
        </div>

        <button
          className="quiz-history-refresh"
          onClick={loadHistory}
          disabled={loading}
          title="Refresh history"
        >
          <RefreshCw size={17} />
        </button>
      </div>

      <input
        className="quiz-history-search"
        type="text"
        placeholder="Search by quiz ID or difficulty..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {error && (
        <div className="quiz-history-error">
          {error}
        </div>
      )}

      {loading ? (
        <p className="quiz-history-message">
          Loading quiz history...
        </p>
      ) : filteredHistory.length === 0 ? (
        <div className="quiz-history-empty">
          <FileText size={35} />
          <h3>No quiz history found</h3>
          <p>Generate a quiz to see it here.</p>
        </div>
      ) : (
        <div className="quiz-history-list">

          {filteredHistory.map((item) => {
            const data = item.quizData;
            const isExpanded = expandedId === item.id;

            return (
              <div
                className="quiz-history-card"
                key={item.id}
              >
                <div className="quiz-history-card-main">

                  <div className="quiz-history-file-icon">
                    <FileText size={21} />
                  </div>

                  <div className="quiz-history-details">
                    <h3>
                      {item.filename || `Quiz #${item.id}`}
                    </h3>

                    <div className="quiz-history-meta">
                      <span>Quiz ID: {item.id}</span>
                      <span>
                        {data.difficulty || "Medium"}
                      </span>
                      <span>
                        {data.total_questions || 0} Questions
                      </span>
                    </div>

                    <small>
                      {item.created_at
                        ? new Date(item.created_at).toLocaleString()
                        : "Date unavailable"}
                    </small>
                  </div>

                  <div className="quiz-history-actions">

                    <button
                      onClick={() =>
                        setExpandedId(
                          isExpanded ? null : item.id
                        )
                      }
                      title="View quiz"
                    >
                      <Eye size={17} />
                      {isExpanded ? "Hide" : "View"}
                    </button>

                    <button
                      className="quiz-history-delete"
                      onClick={() => handleDelete(item.id)}
                      title="Delete quiz"
                    >
                      <Trash2 size={17} />
                    </button>

                    {isExpanded ? (
                      <ChevronUp size={18} />
                    ) : (
                      <ChevronDown size={18} />
                    )}

                  </div>
                </div>

                {isExpanded && (
                  <div className="quiz-history-questions">

                    {(data.questions || []).map(
                      (question, index) => (
                        <div
                          className="quiz-history-question"
                          key={index}
                        >
                          <strong>
                            Q{index + 1}. {question.question}
                          </strong>

                          <div className="quiz-history-options">
                            {question.options.map(
                              (option, optionIndex) => (
                                <div
                                  key={optionIndex}
                                  className={
                                    optionIndex ===
                                    question.correct_answer
                                      ? "quiz-history-correct"
                                      : ""
                                  }
                                >
                                  {String.fromCharCode(
                                    65 + optionIndex
                                  )}. {option}

                                  {optionIndex ===
                                    question.correct_answer && (
                                    <CheckCircle
                                      size={15}
                                    />
                                  )}
                                </div>
                              )
                            )}
                          </div>

                          <div className="quiz-history-explanation">
                            <strong>Explanation:</strong>
                            <p>{question.explanation}</p>
                          </div>
                        </div>
                      )
                    )}

                  </div>
                )}
              </div>
            );
          })}

        </div>
      )}

      <div className="quiz-history-footer">
        Total saved quizzes: {history.length}
      </div>

    </section>
  );
}
