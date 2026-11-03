
import {
  FileText,
  MessageSquare,
  Brain,
  BookOpen,
  Sparkles,
  GraduationCap,
  Layers,
  FolderOpen,
} from "lucide-react";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import FeatureCard from "../components/FeatureCard";
import UploadBox from "../components/UploadBox";

const features = [
  {
    title: "AI PDF Summary",
    description: "Convert lengthy PDFs into concise summaries.",
    icon: FileText,
    color: "purple",
    path: "/summary",
  },
  {
    title: "Chat with PDF",
    description: "Ask questions and understand your documents.",
    icon: MessageSquare,
    color: "blue",
    path: "/chat",
  },
  {
    title: "MCQ Quiz Generator",
    description: "Generate practice questions from your study material.",
    icon: Brain,
    color: "orange",
    path: "/quiz",
  },
  {
    title: "AI Flashcards",
    description: "Create interactive flashcards for quick revision.",
    icon: Layers,
    color: "green",
    path: "/flashcards",
  },
  {
    title: "AI Study Notes",
    description: "Generate organized notes and important exam points.",
    icon: BookOpen,
    color: "purple",
    path: "/study-notes",
  },
  {
    title: "My Documents",
    description: "Manage and access your uploaded study PDFs.",
    icon: FolderOpen,
    color: "blue",
    path: "/documents",
  },
];

function Dashboard() {
  const navigate = useNavigate();
  const [lastUpload, setLastUpload] = useState(null);

  const handleUploadSuccess = (result) => {
    setLastUpload(result);
  };

  return (
    <div className="dashboard-container">

      {/* Welcome Section */}
      <section className="welcome-section">
        <div>
          <div className="welcome-label">
            <Sparkles size={16} />
            AI-POWERED LEARNING
          </div>

          <h1>
            Learn Smarter,
            <br />
            <span>Not Harder.</span>
          </h1>

          <p>
            Upload your study materials and let AI help you
            understand, summarize and prepare for exams.
          </p>
        </div>

        <div className="welcome-art">
          <div className="art-circle">
            <GraduationCap size={80} />
            <Sparkles className="art-sparkle" size={26} />
          </div>
        </div>
      </section>

      {/* Learning Features */}
      <section className="section-heading">
        <div>
          <h2>Your Learning Workspace</h2>
          <p>Everything you need to study effectively.</p>
        </div>

        <span className="workspace-tag">
          STUDYMATE AI 1.0
        </span>
      </section>

      <section className="feature-grid">
        {features.map((feature) => (
          <FeatureCard
            key={feature.title}
            title={feature.title}
            description={feature.description}
            icon={feature.icon}
            color={feature.color}
            onClick={() => navigate(feature.path)}
          />
        ))}
      </section>

      {/* PDF Upload */}
      <UploadBox onUploadSuccess={handleUploadSuccess} />

      {/* Recently Uploaded Document */}
      {lastUpload && (
        <section className="system-section">
          <h3>Recently Uploaded Document</h3>

          <div className="system-card">
            <div>
              <span>Document Name</span>
              <strong>{lastUpload.filename}</strong>
            </div>

            <div>
              <span>Pages Processed</span>
              <strong>{lastUpload.total_pages}</strong>
            </div>

            <div>
              <span>Extracted Characters</span>
              <strong>{lastUpload.extracted_text_length}</strong>
            </div>

            <div>
              <span>Document ID</span>
              <strong>{lastUpload.document_id}</strong>
            </div>
          </div>

          <button
            className="primary-button"
            style={{ marginTop: "15px" }}
            onClick={() => navigate("/documents")}
          >
            View My Documents
          </button>
        </section>
      )}

      {/* System Information */}
      <section className="system-section">
        <h3>System Information</h3>

        <div className="system-card">
          <div>
            <span>PDF Processing</span>
            <strong>Active</strong>
          </div>

          <div>
            <span>AI Integration</span>
            <strong>Gemini / Groq</strong>
          </div>

          <div>
            <span>Database</span>
            <strong>SQLite Connected</strong>
          </div>

          <div>
            <span>Backend</span>
            <strong>FastAPI</strong>
          </div>
        </div>
      </section>

    </div>
  );
}

export default Dashboard;
