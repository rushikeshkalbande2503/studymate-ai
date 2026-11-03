
import { useEffect, useState } from "react";
import {
  BookOpen,
  Brain,
  CheckCircle,
  XCircle,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  FileText,
  RotateCcw,
} from "lucide-react";

import { getDocuments, generateQuiz } from "../services/api";
import QuizHistory from "../components/QuizHistory";

export default function Quiz() {
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  // Load uploaded PDF documents
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoadingDocuments(true);
      setError("");

      const response = await getDocuments();

      const docs = Array.isArray(response)
        ? response
        : response.documents || [];

      setDocuments(docs);

      if (docs.length > 0) {
        setSelectedDocument((previous) =>
          previous && docs.some(
            (doc) => String(doc.id) === previous
          )
            ? previous
            : String(docs[0].id)
        );
      } else {
        setSelectedDocument("");
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

  // Generate AI quiz
  const handleGenerateQuiz = async () => {
    if (!selectedDocument) {
      setError("Please select a PDF document.");
      return;
    }

    try {
      setGenerating(true);
      setError("");

      setQuiz(null);
      setAnswers({});
      setCurrentQuestion(0);
      setSubmitted(false);

      const response = await generateQuiz(
        selectedDocument,
        difficulty,
        numberOfQuestions
      );

      if (
        !response.questions ||
        response.questions.length === 0
      ) {
        throw new Error("No questions were generated.");
      }

      setQuiz(response);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Quiz generation failed. Please try again."
      );
    } finally {
      setGenerating(false);
    }
  };

  // Select an answer
  const handleAnswer = (optionIndex) => {
    if (submitted) return;

    setAnswers((previous) => ({
      ...previous,
      [currentQuestion]: optionIndex,
    }));

    setError("");
  };

  // Submit quiz
  const handleSubmit = () => {
    if (Object.keys(answers).length !== quiz.questions.length) {
      setError("Please answer all questions before submitting.");
      return;
    }

    setError("");
    setSubmitted(true);
  };

  // Start a new quiz
  const handleRestart = () => {
    setQuiz(null);
    setAnswers({});
    setCurrentQuestion(0);
    setSubmitted(false);
    setError("");
  };

  // Calculate score
  const score = quiz
    ? quiz.questions.reduce(
        (total, question, index) =>
          total +
          (answers[index] === question.correct_answer ? 1 : 0),
        0
      )
    : 0;

  const percentage = quiz
    ? Math.round((score / quiz.questions.length) * 100)
    : 0;

  const question = quiz?.questions[currentQuestion];

  if (loadingDocuments) {
    return (
      <div className="quiz-loading">
        <Loader2 className="spin" size={30} />
        <p>Loading your documents...</p>
      </div>
    );
  }

  return (
    <div className="quiz-page">

      {/* PAGE HEADER */}
      <div className="quiz-page-header">
        <div>
          <div className="quiz-heading-icon">
            <Brain size={25} />
          </div>

          <h1>AI Quiz Generator</h1>

          <p>
            Test your knowledge with AI-generated quizzes
            based on your uploaded PDFs.
          </p>
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="quiz-error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError("")}>×</button>
        </div>
      )}

      {/* QUIZ CONFIGURATION */}
      {!quiz && (
        <div className="quiz-setup-card">
          <div className="quiz-card-title">
            <BookOpen size={21} />
            <h2>Create Your Quiz</h2>
          </div>

          <div className="quiz-form-group">
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

          <div className="quiz-settings-grid">
            <div className="quiz-form-group">
              <label>Difficulty Level</label>

              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                disabled={generating}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className="quiz-form-group">
              <label>Number of Questions</label>

              <select
                value={numberOfQuestions}
                onChange={(e) =>
                  setNumberOfQuestions(Number(e.target.value))
                }
                disabled={generating}
              >
                <option value={3}>3 Questions</option>
                <option value={5}>5 Questions</option>
                <option value={10}>10 Questions</option>
                <option value={15}>15 Questions</option>
              </select>
            </div>
          </div>

          <button
            className="quiz-generate-btn"
            onClick={handleGenerateQuiz}
            disabled={generating || documents.length === 0}
          >
            {generating ? (
              <>
                <Loader2 size={19} className="spin" />
                Generating Quiz...
              </>
            ) : (
              <>
                <Brain size={19} />
                Generate AI Quiz
              </>
            )}
          </button>

          {documents.length === 0 && (
            <p className="quiz-empty-note">
              <FileText size={16} />
              Upload a PDF first to generate a quiz.
            </p>
          )}
        </div>
      )}

      {/* ACTIVE QUIZ */}
      {quiz && !submitted && question && (
        <div className="quiz-question-card">

          <div className="quiz-progress-header">
            <div>
              <span className="quiz-label">DOCUMENT</span>
              <h3>{quiz.filename}</h3>
            </div>

            <span className={`quiz-difficulty ${quiz.difficulty}`}>
              {quiz.difficulty}
            </span>
          </div>

          <div className="quiz-progress-info">
            <span>
              Question {currentQuestion + 1} of {quiz.total_questions}
            </span>

            <span>
              {Object.keys(answers).length} Answered
            </span>
          </div>

          <div className="quiz-progress-track">
            <div
              className="quiz-progress-fill"
              style={{
                width: `${
                  ((currentQuestion + 1) / quiz.total_questions) * 100
                }%`,
              }}
            />
          </div>

          <div className="quiz-question-content">
            <span className="quiz-question-number">
              QUESTION {currentQuestion + 1}
            </span>

            <h2>{question.question}</h2>

            <div className="quiz-options">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  className={`quiz-option ${
                    answers[currentQuestion] === index
                      ? "selected"
                      : ""
                  }`}
                  onClick={() => handleAnswer(index)}
                >
                  <span className="quiz-option-letter">
                    {String.fromCharCode(65 + index)}
                  </span>

                  <span>{option}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="quiz-navigation">
            <button
              className="quiz-nav-btn secondary"
              onClick={() =>
                setCurrentQuestion((previous) => previous - 1)
              }
              disabled={currentQuestion === 0}
            >
              <ChevronLeft size={18} />
              Previous
            </button>

            {currentQuestion < quiz.total_questions - 1 ? (
              <button
                className="quiz-nav-btn primary"
                onClick={() =>
                  setCurrentQuestion((previous) => previous + 1)
                }
              >
                Next
                <ChevronRight size={18} />
              </button>
            ) : (
              <button
                className="quiz-nav-btn submit"
                onClick={handleSubmit}
              >
                Submit Quiz
                <CheckCircle size={18} />
              </button>
            )}
          </div>

          <div className="quiz-question-dots">
            {quiz.questions.map((_, index) => (
              <button
                key={index}
                className={`quiz-dot ${
                  currentQuestion === index ? "active" : ""
                } ${
                  answers[index] !== undefined ? "answered" : ""
                }`}
                onClick={() => setCurrentQuestion(index)}
                aria-label={`Go to question ${index + 1}`}
              >
                {index + 1}
              </button>
            ))}
          </div>

        </div>
      )}

      {/* QUIZ RESULT */}
      {quiz && submitted && (
        <div className="quiz-result-card">

          <div className="quiz-result-icon">
            <Trophy size={35} />
          </div>

          <h2>Quiz Completed!</h2>

          <p className="quiz-result-subtitle">
            Here is your performance summary.
          </p>

          <div className="quiz-score-circle">
            <strong>{percentage}%</strong>
            <span>Your Score</span>
          </div>

          <div className="quiz-score-stats">
            <div className="correct-stat">
              <CheckCircle size={20} />
              <strong>{score}</strong>
              <span>Correct</span>
            </div>

            <div className="incorrect-stat">
              <XCircle size={20} />
              <strong>{quiz.total_questions - score}</strong>
              <span>Incorrect</span>
            </div>

            <div>
              <BookOpen size={20} />
              <strong>{quiz.total_questions}</strong>
              <span>Total</span>
            </div>
          </div>

          <h3 className="quiz-review-heading">
            Answer Review
          </h3>

          <div className="quiz-review-list">
            {quiz.questions.map((item, index) => {
              const isCorrect =
                answers[index] === item.correct_answer;

              return (
                <div
                  key={index}
                  className={`quiz-review-item ${
                    isCorrect ? "correct" : "incorrect"
                  }`}
                >
                  <div className="quiz-review-title">
                    {isCorrect ? (
                      <CheckCircle size={19} />
                    ) : (
                      <XCircle size={19} />
                    )}

                    <strong>
                      Question {index + 1}: {item.question}
                    </strong>
                  </div>

                  <p>
                    Your answer:{" "}
                    <strong>
                      {answers[index] !== undefined
                        ? item.options[answers[index]]
                        : "Not answered"}
                    </strong>
                  </p>

                  <p>
                    Correct answer:{" "}
                    <strong>
                      {item.options[item.correct_answer]}
                    </strong>
                  </p>

                  <div className="quiz-explanation">
                    <strong>Explanation:</strong>
                    <p>{item.explanation}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="quiz-result-actions">
            <button
              className="quiz-nav-btn secondary"
              onClick={handleRestart}
            >
              <RotateCcw size={18} />
              Create New Quiz
            </button>
          </div>

          <p className="quiz-provider-info">
            Generated using {quiz.provider} · {quiz.model}
          </p>

        </div>
      )}

      {/* SAVED QUIZ HISTORY */}
      <QuizHistory />

    </div>
  );
}
