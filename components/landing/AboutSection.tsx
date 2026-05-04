import { Fragment } from "react";
import Image from "next/image";

const BAR_HEIGHTS = [28, 38, 22, 36, 30, 42] as const;
const BAR_COLORS = [
  "var(--clr-pink)",
  "var(--clr-red)",
  "var(--clr-yellow)",
  "var(--clr-green)",
  "var(--clr-pink)",
  "var(--clr-red)",
] as const;

const recentReviews = [
  { icon: "✓", color: "var(--clr-green)", branch: "feat/auth-flow",    status: "approved" },
  { icon: "!", color: "var(--clr-pink)",  branch: "fix/payment-bug",   status: "2 issues found" },
  { icon: "~", color: "var(--clr-yellow)",branch: "refactor/db-layer", status: "suggestions" },
] as const;

const stats = [
  { num: "80", unit: "%",   label: "Reduction in\nreview time" },
  { num: "3",  unit: "min", label: "Average time\nto first review" },
  { num: "99", unit: "%",   label: "Fewer bugs\nreaching main" },
] as const;

export default function AboutSection() {
  return (
    <section className="about-section" id="about">
      <div className="section-badge">
        <span className="badge-dot" />
        How it works
      </div>

      <h2 className="about-headline">
        Sniff reads your code, understands
        <br />
        context, and <span className="about-accent">flags issues</span> before
        <br />
        they reach <span className="about-accent-green">production.</span>
      </h2>

      <div className="about-img-wrap">
        <Image
          src="/uploads/about-image.png"
          alt="Sniff product visual — GitHub PR review interface"
          className="about-img"
          width={660}
          height={440}
        />

        {/* Floating card: review coverage chart */}
        <div className="float-card float-tr">
          <div className="fc-header">
            <span className="fc-dot fc-dot-pink" />
            <span className="fc-title">Review Coverage</span>
            <span className="fc-badge">Live</span>
          </div>
          <div className="fc-bars">
            {BAR_HEIGHTS.map((h, i) => (
              <div
                key={i}
                className="fc-bar"
                style={{ height: h, background: BAR_COLORS[i] }}
              />
            ))}
          </div>
          <div className="fc-stat">
            847 <span>PRs reviewed today</span>
          </div>
        </div>

        {/* Floating card: recent reviews */}
        <div className="float-card float-bl">
          <div className="fc-header">
            <span className="fc-dot fc-dot-green" />
            <span className="fc-title">Recent Reviews</span>
          </div>
          <ul className="fc-feed">
            {recentReviews.map(({ icon, color, branch, status }) => (
              <li key={branch}>
                <span className="fc-avatar" style={{ background: color }}>
                  {icon}
                </span>
                <span className="fc-feed-text">
                  <strong>{branch}</strong> — <em>{status}</em>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Stats row */}
      <div className="about-stats">
        {stats.map(({ num, unit, label }, i) => (
          <Fragment key={num}>
            {i > 0 && <div className="stat-divider" />}
            <div className="stat-item">
              <span className="stat-num">
                {num}
                <span className="stat-unit">{unit}</span>
              </span>
              <span className="stat-label">
                {label.split("\n").map((line, j) => (
                  <span key={j}>
                    {line}
                    {j === 0 && <br />}
                  </span>
                ))}
              </span>
            </div>
          </Fragment>
        ))}
      </div>
    </section>
  );
}
