import { useState } from "react";
import { Link } from "react-router-dom";
import "./apartments.css";

export default function ApartmentCard({
  apartment,
  isGoodDeal = false,
  savingsPercent = 0,
  estimatedPrice = null,
  isCompared = false,
  compareDisabled = false,
  onToggleCompare,
}) {
  if (!apartment) return null;

  const [expanded, setExpanded] = useState(false);
  const id = apartment.id || apartment._id;
  const description = apartment.description || "No description available.";
  const canExpand = description.length > 180;

  return (
    <article className="apartments-card card-hover">
      <div className="apartments-cardBody">
        {isGoodDeal ? (
          <span className="apartments-dealBadge apartments-dealBadgeInline">
            🔥 {savingsPercent > 0 ? `${Math.round(savingsPercent)}% ` : ""}Below Market
          </span>
        ) : null}
        <div className="apartments-topRow">
          <h3 className="apartments-price">{apartment.price != null ? `${apartment.price} €` : "— €"}</h3>
          <p className="apartments-location">{apartment.location || "Location unavailable"}</p>
        </div>

        <p className="apartments-meta">
          {apartment.meters != null ? `${apartment.meters} m²` : "— m²"} ·{" "}
          {apartment.rooms != null ? `${apartment.rooms} rooms` : "Rooms n/a"}
        </p>
        {typeof estimatedPrice === "number" ? (
          <p className="apartments-meta">Estimated: {Math.round(estimatedPrice)} €</p>
        ) : null}

        <p className={`apartments-desc ${expanded ? "is-expanded" : ""}`}>{description}</p>

        {canExpand ? (
          <button
            type="button"
            className="apartments-loadMoreBtn"
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? "Show less" : "Load more"}
          </button>
        ) : null}

        <div className="apartments-cardActions">
          {typeof onToggleCompare === "function" ? (
            <button
              type="button"
              className={`apartments-compareBtn ${isCompared ? "is-active" : ""}`}
              onClick={onToggleCompare}
              disabled={compareDisabled}
            >
              {isCompared ? "Remove from Compare" : "Add to Compare"}
            </button>
          ) : null}

          {id ? (
            <Link className="apartments-link" to={`/apartments/${id}`}>
              View details →
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
