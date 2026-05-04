import Image from "next/image";

type Feature = {
  iconColor: string;
  title: string;
  description: string;
  tag: string;
  icon: React.ReactNode;
};

const features: Feature[] = [
  {
    iconColor: "feat-icon-pink",
    title: "Instant PR feedback",
    description:
      "Sniff reviews your pull request the moment it opens — flagging logic errors, style issues, and security gaps before any human sees it.",
    tag: "Auto-triggered",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M7 10l2 2 4-4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    iconColor: "feat-icon-red",
    title: "Inline code comments",
    description:
      "Every issue gets pinned to the exact line. Sniff writes clear, actionable comments so developers know exactly what to fix and why.",
    tag: "Line-level precision",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M4 4h12v10H4z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M7 8h6M7 11h4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    iconColor: "feat-icon-yellow",
    title: "Context-aware analysis",
    description:
      "Sniff understands your codebase — it reads surrounding files, commit history, and PR description to give reviews that actually make sense.",
    tag: "Repo-aware",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M10 3v4M10 13v4M3 10h4M13 10h4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    iconColor: "feat-icon-green",
    title: "Merge confidence score",
    description:
      "Each PR gets a confidence score from Sniff — a clear signal that tells your team whether it's safe to ship, needs work, or requires a human eye.",
    tag: "Risk scoring",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M5 10c0-2.76 2.24-5 5-5s5 2.24 5 5-2.24 5-5 5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M10 7v3l2 2"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function FeaturesSection() {
  return (
    <section className="features-section" id="features">
      {/* Blurred background image */}
      <div className="features-bg-img" aria-hidden="true">
        <Image
          src="/uploads/features-bg.png"
          alt=""
          fill
          style={{ objectFit: "cover", objectPosition: "center" }}
        />
      </div>
      <div className="features-bg-overlay" />

      <div className="section-badge features-badge">
        <span className="badge-dot" />
        Features
      </div>

      <h2 className="features-headline">
        your <span className="features-accent">code review,</span>
        <br />
        fully automated.
      </h2>

      <p className="features-sub">
        Sniff plugs into your GitHub workflow and starts reviewing instantly —
        <br />
        no config needed, no waiting on teammates.
      </p>

      <div className="features-grid">
        {features.map(({ iconColor, title, description, tag, icon }) => (
          <div key={title} className="feat-card">
            <div className={`feat-icon ${iconColor}`}>{icon}</div>
            <h3 className="feat-title">{title}</h3>
            <p className="feat-desc">{description}</p>
            <span className="feat-tag">{tag}</span>
          </div>
        ))}
      </div>

      <a href="/review" className="btn-features">Get Started →</a>
    </section>
  );
}
