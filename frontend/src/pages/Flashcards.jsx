
import { useEffect, useState } from "react";

import {
  Brain,
  BookOpen,
  FileText,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle,
  XCircle,
  Layers,
  Trophy,
  RefreshCw,
  Shuffle,
  Printer,
} from "lucide-react";

import {
  getDocuments,
  generateFlashcards,
  updateFlashcardProgress,
  getActivities,
  getFlashcardSet,
  deleteActivity,
} from "../services/api";

export default function Flashcards() {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================

  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState("");

  const [difficulty, setDifficulty] = useState("medium");
  const [numberOfCards, setNumberOfCards] = useState(10);

  const [flashcardSet, setFlashcardSet] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Individual card progress
  const [progress, setProgress] = useState({});

  // Study modes
  const [studyMode, setStudyMode] = useState("all");
  const [shuffleMode, setShuffleMode] = useState(false);
  const [shuffleOrder, setShuffleOrder] = useState([]);

  // Completion summary
  const [showCompletionSummary, setShowCompletionSummary] =
    useState(false);

  // History
  const [history, setHistory] = useState([]);

  // Loading states
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);

  const [error, setError] = useState("");

  // ==========================================
  // LOAD DOCUMENTS AND HISTORY
  // ==========================================

  useEffect(() => {
    loadDocuments();
    loadHistory();
  }, []);

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
          "Unable to load PDF documents."
      );
    } finally {
      setLoadingDocuments(false);
    }
  };

  // ==========================================
  // LOAD FLASHCARD HISTORY
  // ==========================================

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);

      const response = await getActivities();

      const activities = Array.isArray(response)
        ? response
        : response.activities || [];

      const flashcardHistory = activities.filter(
        (item) => item.activity_type === "flashcards"
      );

      setHistory(flashcardHistory);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to load flashcard history."
      );
    } finally {
      setLoadingHistory(false);
    }
  };

  // ==========================================
  // GENERATE FLASHCARDS
  // ==========================================

  const handleGenerate = async () => {
    if (!selectedDocument) {
      setError("Please select a PDF document.");
      return;
    }

    try {
      setGenerating(true);
      setError("");

      setFlashcardSet(null);
      setCurrentIndex(0);
      setIsFlipped(false);
      setProgress({});

      setStudyMode("all");
      setShuffleMode(false);
      setShuffleOrder([]);
      setShowCompletionSummary(false);

      const response = await generateFlashcards(
        selectedDocument,
        difficulty,
        numberOfCards
      );

      setFlashcardSet(response);

      const initialProgress = {};

      response.flashcards.forEach((card, index) => {
        initialProgress[index] = card.status || "revision";
      });

      setProgress(initialProgress);

      await loadHistory();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to generate flashcards. Please try again."
      );
    } finally {
      setGenerating(false);
    }
  };

  // ==========================================
  // LOAD SAVED FLASHCARD SET
  // ==========================================

  const handleViewHistory = async (activityId) => {
    try {
      setError("");

      const response = await getFlashcardSet(activityId);

      setFlashcardSet(response);
      setCurrentIndex(0);
      setIsFlipped(false);

      setStudyMode("all");
      setShuffleMode(false);
      setShuffleOrder([]);
      setShowCompletionSummary(false);

      const savedProgress = {};

      response.flashcards.forEach((card, index) => {
        savedProgress[index] = card.status || "revision";
      });

      setProgress(savedProgress);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to open saved flashcards."
      );
    }
  };

  // ==========================================
  // DELETE FLASHCARD HISTORY
  // ==========================================

  const handleDeleteHistory = async (activityId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this flashcard set?"
    );

    if (!confirmed) return;

    try {
      setError("");

      await deleteActivity(activityId);

      setHistory((previous) =>
        previous.filter((item) => item.id !== activityId)
      );

      if (flashcardSet?.activity_id === activityId) {
        handleNewSet();
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to delete flashcard history."
      );
    }
  };

  // ==========================================
  // CHANGE STUDY MODE
  // ==========================================

  const handleStudyModeChange = (mode) => {
    setStudyMode(mode);

    setShuffleMode(false);
    setShuffleOrder([]);

    setCurrentIndex(0);
    setIsFlipped(false);
    setShowCompletionSummary(false);
    setError("");
  };

  // ==========================================
  // SHUFFLE FLASHCARDS
  // ==========================================

  const handleShuffle = () => {
    if (studyCards.length < 2) {
      setError("At least two cards are required to shuffle.");
      return;
    }

    const indexes = studyCards.map(
      (card) => card.originalIndex
    );

    // Fisher-Yates shuffle algorithm
    for (let i = indexes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));

      [indexes[i], indexes[j]] = [
        indexes[j],
        indexes[i],
      ];
    }

    setShuffleOrder(indexes);
    setShuffleMode(true);

    setCurrentIndex(0);
    setIsFlipped(false);
    setShowCompletionSummary(false);
    setError("");
  };

  // ==========================================
  // UPDATE LEARNING PROGRESS
  // ==========================================

  const handleProgress = async (status) => {
    if (
      !flashcardSet ||
      originalCardIndex === undefined ||
      savingProgress
    ) {
      return;
    }

    try {
      setSavingProgress(true);
      setError("");

      await updateFlashcardProgress(
        flashcardSet.activity_id,
        originalCardIndex,
        status
      );

      setProgress((previous) => ({
        ...previous,
        [originalCardIndex]: status,
      }));

      // If a card leaves the selected filtered mode,
      // keep the current index within the new list.
      const cardLeavesMode =
        (studyMode === "revision" && status === "known") ||
        (studyMode === "known" && status === "revision");

      if (cardLeavesMode) {
        setCurrentIndex((previous) =>
          Math.min(
            previous,
            Math.max(0, studyCards.length - 2)
          )
        );
      }

      await loadHistory();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to save learning progress."
      );
    } finally {
      setSavingProgress(false);
    }
  };

  // ==========================================
  // CARD NAVIGATION
  // ==========================================

  const handleNext = () => {
    if (currentIndex < orderedStudyCards.length - 1) {
      setCurrentIndex((previous) => previous + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((previous) => previous - 1);
      setIsFlipped(false);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowCompletionSummary(false);
  };

  // ==========================================
  // EXPORT FLASHCARDS AS PDF
  // ==========================================

  const handleExportPDF = () => {
    if (!flashcardSet?.flashcards?.length) {
      setError("There are no flashcards available to export.");
      return;
    }

    const cleanupPrintMode = () => {
      document.body.classList.remove("flashcards-print-mode");
    };

    document.body.classList.add("flashcards-print-mode");
    window.addEventListener("afterprint", cleanupPrintMode, { once: true });
    window.print();
  };

  // ==========================================
  // FINISH STUDY SESSION
  // ==========================================

  const handleFinishStudy = () => {
    setShowCompletionSummary(true);
    setIsFlipped(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleStudyAgain = () => {
    setShowCompletionSummary(false);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  // ==========================================
  // RESET TO GENERATOR
  // ==========================================

  const handleNewSet = () => {
    setFlashcardSet(null);

    setCurrentIndex(0);
    setIsFlipped(false);
    setProgress({});

    setStudyMode("all");
    setShuffleMode(false);
    setShuffleOrder([]);

    setShowCompletionSummary(false);
    setError("");
  };

  // ==========================================
  // PROGRESS AND FILTERED CARDS
  // ==========================================

  const knownCount = Object.values(progress).filter(
    (status) => status === "known"
  ).length;

  const revisionCount = flashcardSet
    ? flashcardSet.flashcards.length - knownCount
    : 0;

  // Preserve original indexes for database updates.
  const studyCards = flashcardSet
    ? flashcardSet.flashcards
        .map((card, originalIndex) => ({
          ...card,
          originalIndex,
          currentStatus:
            progress[originalIndex] || card.status || "revision",
        }))
        .filter((card) => {
          if (studyMode === "known") {
            return card.currentStatus === "known";
          }

          if (studyMode === "revision") {
            return card.currentStatus !== "known";
          }

          return true;
        })
    : [];

  // Apply shuffled order if enabled.
  const orderedStudyCards = shuffleMode
    ? shuffleOrder
        .map((index) =>
          studyCards.find(
            (card) => card.originalIndex === index
          )
        )
        .filter(Boolean)
    : studyCards;

  // Keep index valid if filtered cards change.
  const safeCurrentIndex =
    orderedStudyCards.length > 0
      ? Math.min(currentIndex, orderedStudyCards.length - 1)
      : 0;

  const currentCard = orderedStudyCards[safeCurrentIndex];

  const originalCardIndex = currentCard?.originalIndex;

  const completedPercentage = flashcardSet
    ? Math.round(
        (knownCount / flashcardSet.flashcards.length) * 100
      )
    : 0;

  // ==========================================
  // LOADING SCREEN
  // ==========================================

  if (loadingDocuments) {
    return (
      <div className="flashcard-loading">
        <Loader2 className="spin" size={30} />
        <p>Loading your documents...</p>
      </div>
    );
  }

  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <div className="flashcards-page">

      {/* PAGE HEADER */}

      <div className="flashcards-header">
        <div className="flashcards-heading-icon">
          <Brain size={25} />
        </div>

        <h1>AI Flashcards</h1>

        <p>
          Learn faster with AI-generated flashcards
          from your uploaded PDF documents.
        </p>
      </div>

      {/* ERROR MESSAGE */}

      {error && (
        <div className="flashcards-error">
          <AlertCircle size={18} />

          <span>{error}</span>

          <button onClick={() => setError("")}>
            ×
          </button>
        </div>
      )}

      {/* ======================================
          FLASHCARD GENERATOR
      ====================================== */}

      {!flashcardSet && (
        <div className="flashcards-setup-card">

          <div className="flashcards-section-title">
            <Layers size={21} />
            <h2>Create Flashcards</h2>
          </div>

          <div className="flashcards-form-group">
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

          <div className="flashcards-settings-grid">

            <div className="flashcards-form-group">
              <label>Difficulty Level</label>

              <select
                value={difficulty}
                onChange={(e) =>
                  setDifficulty(e.target.value)
                }
                disabled={generating}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className="flashcards-form-group">
              <label>Number of Cards</label>

              <select
                value={numberOfCards}
                onChange={(e) =>
                  setNumberOfCards(Number(e.target.value))
                }
                disabled={generating}
              >
                <option value={5}>5 Cards</option>
                <option value={10}>10 Cards</option>
                <option value={15}>15 Cards</option>
                <option value={20}>20 Cards</option>
                <option value={30}>30 Cards</option>
              </select>
            </div>

          </div>

          <button
            className="flashcards-generate-btn"
            onClick={handleGenerate}
            disabled={generating || documents.length === 0}
          >
            {generating ? (
              <>
                <Loader2 size={19} className="spin" />
                Generating Flashcards...
              </>
            ) : (
              <>
                <Brain size={19} />
                Generate AI Flashcards
              </>
            )}
          </button>

          {documents.length === 0 && (
            <p className="flashcards-empty-note">
              <FileText size={16} />
              Upload a PDF first to generate flashcards.
            </p>
          )}

        </div>
      )}

      {/* ======================================
          ACTIVE FLASHCARD SET
      ====================================== */}

      {flashcardSet && (
        <div className="flashcards-study-section">

          {/* DOCUMENT HEADER */}

          <div className="flashcards-study-header">
            <div>
              <span className="flashcards-label">
                STUDY DOCUMENT
              </span>

              <h2>{flashcardSet.filename}</h2>

              <span className="flashcards-difficulty">
                {flashcardSet.difficulty || difficulty}
              </span>
            </div>

            <div className="flashcards-header-actions">
              <button
                className="flashcards-export-btn"
                onClick={handleExportPDF}
                title="Print or save all flashcards as PDF"
              >
                <Printer size={17} />
                Export PDF
              </button>

              <button
                className="flashcards-new-btn"
                onClick={handleNewSet}
              >
                <RotateCcw size={17} />
                New Set
              </button>
            </div>
          </div>

          {/* PRINT-READY CONTENT: includes every card, not only the active study mode */}
          <div className="flashcards-print-document">
            <header className="flashcards-print-header">
              <h1>StudyMate AI – Flashcards</h1>
              <h2>{flashcardSet.filename}</h2>
              <p>Difficulty: {flashcardSet.difficulty || difficulty}</p>
              <p>Known: {knownCount} | Need Revision: {revisionCount} | Total: {flashcardSet.flashcards.length}</p>
              <p>Learning progress: {completedPercentage}% Known</p>
            </header>

            {flashcardSet.flashcards.map((card, index) => {
              const cardStatus = progress[index] || card.status || "revision";
              return (
                <article className="flashcards-print-card" key={`print-${index}`}>
                  <h3>Card {index + 1}</h3>
                  <p><strong>Question:</strong> {card.question}</p>
                  <p><strong>Answer:</strong> {card.answer}</p>
                  {card.explanation && (
                    <p><strong>Explanation:</strong> {card.explanation}</p>
                  )}
                  <p className="flashcards-print-status">Status: {cardStatus === "known" ? "Known" : "Need Revision"}</p>
                </article>
              );
            })}
          </div>

          {/* PROGRESS SUMMARY */}

          <div className="flashcards-progress-summary">

            <div>
              <strong>{knownCount}</strong>
              <span>Known</span>
            </div>

            <div>
              <strong>{revisionCount}</strong>
              <span>Need Revision</span>
            </div>

            <div>
              <strong>
                {flashcardSet.flashcards.length}
              </strong>
              <span>Total Cards</span>
            </div>

          </div>

          {/* PROGRESS BAR */}

          <div className="flashcards-progress-track">
            <div
              className="flashcards-progress-fill"
              style={{
                width: `${completedPercentage}%`,
              }}
            />
          </div>

          <div className="flashcards-progress-caption">
            <span>Learning progress</span>
            <strong>{completedPercentage}% Known</strong>
          </div>

          {/* ==================================
              COMPLETION SUMMARY
          ================================== */}

          {showCompletionSummary ? (

            <div className="flashcards-completion-summary">

              <div className="flashcards-completion-icon">
                <Trophy size={35} />
              </div>

              <h2>Study Session Completed!</h2>

              <p>
                Great work! Here is your learning progress.
              </p>

              <div className="flashcards-completion-stats">

                <div>
                  <CheckCircle size={22} />
                  <strong>{knownCount}</strong>
                  <span>Known Cards</span>
                </div>

                <div>
                  <RefreshCw size={22} />
                  <strong>{revisionCount}</strong>
                  <span>Need Revision</span>
                </div>

                <div>
                  <Layers size={22} />
                  <strong>
                    {flashcardSet.flashcards.length}
                  </strong>
                  <span>Total Cards</span>
                </div>

              </div>

              <div className="flashcards-completion-progress">
                <div
                  style={{
                    width: `${completedPercentage}%`,
                  }}
                />
              </div>

              <h3>{completedPercentage}% Mastered</h3>

              <p>
                {revisionCount === 0
                  ? "Excellent! All cards are marked as known."
                  : `${revisionCount} cards are still waiting for revision.`}
              </p>

              <div className="flashcards-completion-actions">

                <button
                  className="flashcards-export-btn"
                  onClick={handleExportPDF}
                >
                  <Printer size={18} />
                  Export PDF
                </button>

                <button
                  className="flashcards-generate-btn"
                  onClick={handleStudyAgain}
                >
                  <RotateCcw size={18} />
                  Study Again
                </button>

                <button
                  className="flashcards-nav-btn secondary"
                  onClick={handleNewSet}
                >
                  <Layers size={18} />
                  Generate New Set
                </button>

              </div>

            </div>

          ) : (

            <>
              {/* ==================================
                  STUDY MODE CONTROLS
              ================================== */}

              <div className="flashcard-study-modes">

                <div className="flashcard-mode-heading">
                  <h3>Study Mode</h3>
                  <span>
                    Choose which cards to practice
                  </span>
                </div>

                <div className="flashcard-mode-buttons">

                  <button
                    className={
                      studyMode === "all" ? "active" : ""
                    }
                    onClick={() =>
                      handleStudyModeChange("all")
                    }
                  >
                    <Layers size={16} />
                    All Cards ({flashcardSet.flashcards.length})
                  </button>

                  <button
                    className={
                      studyMode === "revision" ? "active" : ""
                    }
                    onClick={() =>
                      handleStudyModeChange("revision")
                    }
                  >
                    <RefreshCw size={16} />
                    Need Revision ({revisionCount})
                  </button>

                  <button
                    className={
                      studyMode === "known" ? "active" : ""
                    }
                    onClick={() =>
                      handleStudyModeChange("known")
                    }
                  >
                    <CheckCircle size={16} />
                    Known Cards ({knownCount})
                  </button>

                  <button
                    className={
                      shuffleMode
                        ? "active shuffle-active"
                        : ""
                    }
                    onClick={handleShuffle}
                    disabled={studyCards.length < 2}
                  >
                    <Shuffle size={16} />
                    Shuffle
                  </button>

                </div>
              </div>

              {/* ==================================
                  EMPTY STUDY MODE
              ================================== */}

              {orderedStudyCards.length === 0 ? (

                <div className="flashcard-no-cards">
                  <CheckCircle size={30} />

                  <h3>No cards in this category</h3>

                  <p>
                    Choose another study mode to continue learning.
                  </p>
                </div>

              ) : (

                <>
                  {/* CARD COUNTER */}

                  <div className="flashcards-card-counter">
                    Card {safeCurrentIndex + 1} of{" "}
                    {orderedStudyCards.length}
                  </div>

                  {/* ==================================
                      FLIP CARD
                  ================================== */}

                  <div
                    className={`flashcard-flip-container ${
                      isFlipped ? "flipped" : ""
                    }`}
                    onClick={() =>
                      setIsFlipped((previous) => !previous)
                    }
                    role="button"
                    tabIndex={0}
                    aria-label="Flip flashcard to reveal answer"
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" ||
                        e.key === " "
                      ) {
                        e.preventDefault();

                        setIsFlipped(
                          (previous) => !previous
                        );
                      }
                    }}
                  >

                    <div className="flashcard-flip-inner">

                      {/* FRONT SIDE */}

                      <div className="flashcard-face flashcard-front">

                        <span className="flashcard-side-label">
                          <BookOpen size={16} />
                          QUESTION
                        </span>

                        <h2>{currentCard.question}</h2>

                        <div className="flashcard-tap-hint">
                          Click to reveal answer
                        </div>

                      </div>

                      {/* BACK SIDE */}

                      <div className="flashcard-face flashcard-back">

                        <span className="flashcard-side-label">
                          <CheckCircle size={16} />
                          ANSWER
                        </span>

                        <h2>{currentCard.answer}</h2>

                        {currentCard.explanation && (
                          <div className="flashcard-explanation">
                            <strong>Explanation</strong>
                            <p>{currentCard.explanation}</p>
                          </div>
                        )}

                        <div className="flashcard-tap-hint">
                          Click to see question
                        </div>

                      </div>

                    </div>
                  </div>

                  {/* ==================================
                      NAVIGATION
                  ================================== */}

                  <div className="flashcards-navigation">

                    <button
                      className="flashcards-nav-btn secondary"
                      onClick={handlePrevious}
                      disabled={safeCurrentIndex === 0}
                    >
                      <ChevronLeft size={19} />
                      Previous
                    </button>

                    <button
                      className="flashcards-nav-btn secondary"
                      onClick={handleRestart}
                    >
                      <RotateCcw size={17} />
                      Restart
                    </button>

                    <button
                      className="flashcards-nav-btn primary"
                      onClick={handleNext}
                      disabled={
                        safeCurrentIndex ===
                        orderedStudyCards.length - 1
                      }
                    >
                      Next
                      <ChevronRight size={19} />
                    </button>

                  </div>

                  {/* ==================================
                      LEARNING ACTIONS
                  ================================== */}

                  <div className="flashcards-learning-actions">

                    <button
                      className={`flashcards-revision-btn ${
                        currentCard.currentStatus === "revision"
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        handleProgress("revision")
                      }
                      disabled={savingProgress}
                    >
                      {savingProgress ? (
                        <Loader2 size={19} className="spin" />
                      ) : (
                        <XCircle size={19} />
                      )}

                      Need Revision
                    </button>

                    <button
                      className={`flashcards-known-btn ${
                        currentCard.currentStatus === "known"
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        handleProgress("known")
                      }
                      disabled={savingProgress}
                    >
                      {savingProgress ? (
                        <Loader2 size={19} className="spin" />
                      ) : (
                        <CheckCircle size={19} />
                      )}

                      I Know This
                    </button>

                  </div>

                  {/* FINISH STUDY */}

                  <div className="flashcards-finish-section">
                    <button
                      className="flashcards-finish-btn"
                      onClick={handleFinishStudy}
                    >
                      <Trophy size={18} />
                      Finish Study Session
                    </button>
                  </div>

                </>
              )}

            </>
          )}

          {/* AI PROVIDER */}

          <p className="flashcards-provider">
            Generated using {flashcardSet.provider || "AI"}
            {flashcardSet.model
              ? ` · ${flashcardSet.model}`
              : ""}
          </p>

        </div>
      )}

      {/* ======================================
          FLASHCARD HISTORY
      ====================================== */}

      <div className="flashcard-history-section">

        <div className="flashcard-history-header">

          <div>
            <div className="flashcard-history-title">
              <Trophy size={21} />
              <h2>Flashcard History</h2>
            </div>

            <p>
              Continue learning from your previously generated sets.
            </p>
          </div>

          <button
            className="flashcard-history-refresh"
            onClick={loadHistory}
            disabled={loadingHistory}
            title="Refresh history"
          >
            <RefreshCw
              size={17}
              className={loadingHistory ? "spin" : ""}
            />
          </button>

        </div>

        {loadingHistory ? (

          <p className="flashcard-history-message">
            Loading flashcard history...
          </p>

        ) : history.length === 0 ? (

          <div className="flashcard-history-empty">
            <FileText size={34} />
            <h3>No flashcard history yet</h3>
            <p>Generate your first flashcard set.</p>
          </div>

        ) : (

          <div className="flashcard-history-list">

            {history.map((item) => {
              let data = {};

              try {
                data =
                  typeof item.result === "string"
                    ? JSON.parse(item.result)
                    : item.result || {};
              } catch {
                data = {};
              }

              const cards = data.flashcards || [];

              const known = cards.filter(
                (card) => card.status === "known"
              ).length;

              return (
                <div
                  className="flashcard-history-card"
                  key={item.id}
                >

                  <div className="flashcard-history-main">

                    <div className="flashcard-history-icon">
                      <Layers size={21} />
                    </div>

                    <div className="flashcard-history-details">

                      <h3>
                        {item.filename ||
                          `Flashcard Set #${item.id}`}
                      </h3>

                      <div className="flashcard-history-meta">
                        <span>Set #{item.id}</span>

                        <span>
                          {data.difficulty || "Medium"}
                        </span>

                        <span>{cards.length} Cards</span>

                        <span>{known} Known</span>
                      </div>

                      <small>
                        {item.created_at
                          ? new Date(
                              item.created_at
                            ).toLocaleString()
                          : "Date unavailable"}
                      </small>

                    </div>

                    <div className="flashcard-history-actions">

                      <button
                        onClick={() =>
                          handleViewHistory(item.id)
                        }
                      >
                        <BookOpen size={16} />
                        Study
                      </button>

                      <button
                        className="flashcard-history-delete"
                        onClick={() =>
                          handleDeleteHistory(item.id)
                        }
                        title="Delete flashcard set"
                      >
                        <XCircle size={17} />
                      </button>

                    </div>

                  </div>

                </div>
              );
            })}

          </div>
        )}

        <div className="flashcard-history-footer">
          Total saved sets: {history.length}
        </div>

      </div>

    </div>
  );
}
