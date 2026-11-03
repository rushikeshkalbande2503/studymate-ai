
import axios from "axios";

// ==========================================
// CONFIGURATION
// ==========================================

const AI_REQUEST_TIMEOUT = 300000; // 5 minutes
const UPLOAD_TIMEOUT = 60000; // 1 minute

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
  timeout: 30000,
  headers: {
    Accept: "application/json",
  },
});

// ==========================================
// BACKEND HEALTH CHECK
// ==========================================

export const checkBackend = async () => {
  const response = await API.get("/health");
  return response.data;
};

// ==========================================
// PROJECT INFORMATION
// ==========================================

export const getProjectInfo = async () => {
  const response = await API.get("/api/info");
  return response.data;
};

// ==========================================
// PDF UPLOAD
// ==========================================

export const uploadPDF = async (file, onProgress) => {
  const formData = new FormData();

  formData.append("file", file);

  const response = await API.post(
    "/api/documents/upload",
    formData,
    {
      timeout: UPLOAD_TIMEOUT,
      onUploadProgress: (event) => {
        if (event.total) {
          const percentage = Math.round(
            (event.loaded * 100) / event.total
          );

          onProgress?.(percentage);
        }
      },
    }
  );

  return response.data;
};

// ==========================================
// GET ALL DOCUMENTS
// ==========================================

export const getDocuments = async () => {
  const response = await API.get("/api/documents");
  return response.data;
};

// ==========================================
// GET SINGLE DOCUMENT
// ==========================================

export const getDocument = async (documentId) => {
  const response = await API.get(
    `/api/documents/${documentId}`
  );

  return response.data;
};

// ==========================================
// DELETE DOCUMENT
// ==========================================

export const deleteDocument = async (documentId) => {
  const response = await API.delete(
    `/api/documents/${documentId}`
  );

  return response.data;
};

// ==========================================
// AI PDF SUMMARY
// ==========================================

export const generateSummary = async (documentId) => {
  const response = await API.post(
    `/api/documents/${documentId}/summary`,
    {},
    {
      timeout: AI_REQUEST_TIMEOUT,
    }
  );

  return response.data;
};

// ==========================================
// CREATE STUDY ACTIVITY
// ==========================================

export const createActivity = async (activityData) => {
  const response = await API.post(
    "/api/activities",
    activityData
  );

  return response.data;
};

// ==========================================
// GET STUDY ACTIVITIES
// ==========================================

export const getActivities = async (documentId = null) => {
  const response = await API.get("/api/activities", {
    params: documentId
      ? { document_id: documentId }
      : {},
  });

  return response.data;
};

// ==========================================
// DELETE STUDY ACTIVITY
// ==========================================

export const deleteActivity = async (activityId) => {
  const response = await API.delete(
    `/api/activities/${activityId}`
  );

  return response.data;
};

// ==========================================
// CHAT WITH PDF
// ==========================================

export const chatWithPDF = async (
  documentId,
  question,
  history = []
) => {
  const response = await API.post(
    `/api/documents/${documentId}/chat`,
    {
      question,
      history,
    },
    {
      timeout: AI_REQUEST_TIMEOUT,
    }
  );

  return response.data;
};

// ==========================================
// AI QUIZ GENERATOR
// ==========================================

export const generateQuiz = async (
  documentId,
  difficulty = "medium",
  numberOfQuestions = 5
) => {
  const response = await API.post(
    `/api/documents/${documentId}/quiz`,
    {
      document_id: Number(documentId),
      difficulty,
      number_of_questions: numberOfQuestions,
    },
    {
      timeout: AI_REQUEST_TIMEOUT,
    }
  );

  return response.data;
};

// ==========================================
// AI FLASHCARDS GENERATOR
// ==========================================

export const generateFlashcards = async (
  documentId,
  difficulty = "medium",
  numberOfCards = 10
) => {
  const response = await API.post(
    `/api/documents/${documentId}/flashcards`,
    {
      document_id: Number(documentId),
      difficulty,
      number_of_cards: numberOfCards,
    },
    {
      timeout: AI_REQUEST_TIMEOUT,
    }
  );

  return response.data;
};

// ==========================================
// GET SAVED FLASHCARD SET
// ==========================================

export const getFlashcardSet = async (activityId) => {
  const response = await API.get(
    `/api/flashcards/${activityId}`
  );

  return response.data;
};

// ==========================================
// UPDATE FLASHCARD PROGRESS
// ==========================================

export const updateFlashcardProgress = async (
  activityId,
  cardIndex,
  status
) => {
  const response = await API.put(
    `/api/flashcards/${activityId}/progress`,
    {
      card_index: cardIndex,
      status,
    }
  );

  return response.data;
};

// ==========================================
// AI STUDY NOTES GENERATOR
// ==========================================

export const generateStudyNotes = async (documentId) => {
  const response = await API.post(
    `/api/documents/${documentId}/study-notes`,
    {},
    {
      timeout: AI_REQUEST_TIMEOUT,
    }
  );

  return response.data;
};

// ==========================================
// GET STUDY NOTES HISTORY
// ==========================================

export const getStudyNotesHistory = async (documentId = null) => {
  const response = await API.get("/api/activities", {
    params: documentId
      ? { document_id: documentId }
      : {},
  });

  const activities = Array.isArray(response.data)
    ? response.data
    : response.data?.activities || [];

  return activities.filter(
    (activity) =>
      activity.activity_type === "study_notes"
  );
};

// ==========================================
// EXPORT AXIOS INSTANCE
// ==========================================

export default API;
