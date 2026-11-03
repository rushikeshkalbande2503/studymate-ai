
import { useRef, useState } from "react";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { uploadPDF } from "../services/api";

function UploadBox({ onUploadSuccess }) {
  const fileInputRef = useRef(null);

  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleFile = async (file) => {
    setMessage("");
    setError("");
    setProgress(0);

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please select a PDF file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size must not exceed 10 MB.");
      return;
    }

    if (file.size === 0) {
      setError("Selected file is empty.");
      return;
    }

    try {
      setLoading(true);

      const result = await uploadPDF(file, setProgress);

      setMessage(
        `${result.filename} uploaded successfully! ` +
        `${result.total_pages} pages processed.`
      );

      onUploadSuccess?.(result);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Upload failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="upload-section">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        hidden
        onChange={(event) => {
          handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      <div className="upload-content">
        <div className="upload-icon">
          <Upload size={25} />
        </div>

        <h2>Start with your study material</h2>

        <p>
          Upload your PDF and let StudyMate AI extract
          its content for intelligent learning.
        </p>

        <button
          className="upload-button"
          disabled={loading}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={18} />
          {loading ? "Uploading..." : "Choose PDF"}
        </button>

        <p className="upload-hint">PDF only · Maximum 10 MB</p>

        {loading && (
          <div className="upload-progress">
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span>{progress}%</span>
          </div>
        )}

        {message && (
          <div className="upload-success">
            <CheckCircle size={17} />
            {message}
          </div>
        )}

        {error && (
          <div className="upload-error">
            <AlertCircle size={17} />
            {error}
          </div>
        )}
      </div>
    </section>
  );
}

export default UploadBox;
