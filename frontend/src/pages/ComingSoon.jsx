
import { Sparkles, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

function ComingSoon({ title, description }) {
  const navigate = useNavigate();

  return (
    <div className="dashboard-container">
      <section className="coming-page">

        <div className="coming-page-icon">
          <Sparkles size={40} />
        </div>

        <span className="coming-page-label">
          STUDYMATE AI DEVELOPMENT
        </span>

        <h1>{title}</h1>

        <p>{description}</p>

        <div className="development-status">
          <span className="status-dot" />
          Feature under development
        </div>

        <button
          className="primary-button"
          onClick={() => navigate("/")}
        >
          <ArrowLeft size={17} />
          Back to Dashboard
        </button>

      </section>
    </div>
  );
}

export default ComingSoon;
