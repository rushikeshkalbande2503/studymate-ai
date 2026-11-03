
import { ArrowUpRight } from "lucide-react";

function FeatureCard({
  title,
  description,
  icon: Icon,
  color,
  onClick,
}) {
  return (
    <article
      className="feature-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Open ${title}`}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className={`feature-icon ${color}`}>
        <Icon size={23} />
      </div>

      <span className="coming-label">Available</span>

      <h3>{title}</h3>

      <p>{description}</p>

      <div className="feature-footer">
        <span>Explore feature</span>
        <ArrowUpRight size={17} />
      </div>
    </article>
  );
}

export default FeatureCard;
