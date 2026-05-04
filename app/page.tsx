import Image from "next/image";
import VideoBackground from "@/components/video-background";

const GitHubIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const teamMembers = [
  {
    name: "Jonathan",
    github: "https://github.com/Jonathanrbt",
    linkedin: "https://www.linkedin.com/in/jonathan-romero-b2044a303/",
  },
  {
    name: "Andrew",
    github: "https://github.com/Andss-ye",
    linkedin: "https://www.linkedin.com/in/andss-ye/",
  },
  {
    name: "Julian",
    github: "https://github.com/Julianlamaravilla",
    linkedin: "https://www.linkedin.com/in/jarestrepo/",
  },
];

export default function Home() {
  return (
    <div className="landing">
      {/* ── Hero ── */}
      <div className="scene">
        <VideoBackground />

        <nav>
          <div className="nav-inner">
            <a href="#" className="logo">
              Sniff
            </a>
            <ul className="nav-links">
              <li>
                <a href="#" className="nav-active">
                  Home
                </a>
              </li>
              <li>
                <a href="#features">Features</a>
              </li>
              <li>
                <a href="#about">How it works</a>
              </li>
              <li>
                <a href="#">Pricing</a>
              </li>
              <li>
                <a href="#">Docs</a>
              </li>
            </ul>
            <button className="btn-nav">Trial</button>
          </div>
        </nav>

        <section className="hero">
          <h1 className="hero-headline animate-fade-rise">
            Your AI agent that <span className="accent">reviews</span> every
            <br />
            PR before <span className="accent">humans do.</span>
          </h1>

          <p className="hero-desc animate-fade-rise-delay">
            Sniff connects to your GitHub repos and automatically reviews pull
            requests — catching bugs, enforcing standards, and leaving precise
            comments in seconds.
          </p>

          <button className="btn-hero animate-fade-rise-delay-2">Trial</button>

          <div className="hero-rule animate-fade-rise-delay-2">
            <span className="r1" />
            <span className="r2" />
            <span className="r3" />
            <span className="r4" />
          </div>
        </section>
      </div>

      {/* ── About / How It Works ── */}
      <section className="about-section" id="about">
        <div className="about-badge">
          <span className="badge-dot" />
          How it works
        </div>

        <h2 className="about-headline">
          Sniff reads your code, understands
          <br />
          context, and{" "}
          <span className="about-accent">flags issues</span> before
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
              <div
                className="fc-bar"
                style={{ height: 28, background: "var(--clr-pink)" }}
              />
              <div
                className="fc-bar"
                style={{ height: 38, background: "var(--clr-red)" }}
              />
              <div
                className="fc-bar"
                style={{ height: 22, background: "var(--clr-yellow)" }}
              />
              <div
                className="fc-bar"
                style={{ height: 36, background: "var(--clr-green)" }}
              />
              <div
                className="fc-bar"
                style={{ height: 30, background: "var(--clr-pink)" }}
              />
              <div
                className="fc-bar"
                style={{ height: 42, background: "var(--clr-red)" }}
              />
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
              <li>
                <span
                  className="fc-avatar"
                  style={{ background: "var(--clr-green)" }}
                >
                  ✓
                </span>
                <span className="fc-feed-text">
                  <strong>feat/auth-flow</strong> — <em>approved</em>
                </span>
              </li>
              <li>
                <span
                  className="fc-avatar"
                  style={{ background: "var(--clr-pink)" }}
                >
                  !
                </span>
                <span className="fc-feed-text">
                  <strong>fix/payment-bug</strong> — <em>2 issues found</em>
                </span>
              </li>
              <li>
                <span
                  className="fc-avatar"
                  style={{ background: "var(--clr-yellow)" }}
                >
                  ~
                </span>
                <span className="fc-feed-text">
                  <strong>refactor/db-layer</strong> — <em>suggestions</em>
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Stats row */}
        <div className="about-stats">
          <div className="stat-item">
            <span className="stat-num">
              80<span className="stat-unit">%</span>
            </span>
            <span className="stat-label">
              Reduction in
              <br />
              review time
            </span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-num">
              3<span className="stat-unit">min</span>
            </span>
            <span className="stat-label">
              Average time
              <br />
              to first review
            </span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-num">
              99<span className="stat-unit">%</span>
            </span>
            <span className="stat-label">
              Fewer bugs
              <br />
              reaching main
            </span>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="features-section" id="features">
        <div className="features-bg-img" aria-hidden="true">
          <Image
            src="/uploads/features-bg.png"
            alt=""
            fill
            style={{ objectFit: "cover", objectPosition: "center" }}
          />
        </div>
        <div className="features-bg-overlay" />

        <div className="about-badge features-badge">
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
          <div className="feat-card">
            <div className="feat-icon feat-icon-pink">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle
                  cx="10"
                  cy="10"
                  r="8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M7 10l2 2 4-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="feat-title">Instant PR feedback</h3>
            <p className="feat-desc">
              Sniff reviews your pull request the moment it opens — flagging
              logic errors, style issues, and security gaps before any human
              sees it.
            </p>
            <span className="feat-tag">Auto-triggered</span>
          </div>

          <div className="feat-card">
            <div className="feat-icon feat-icon-red">
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
            </div>
            <h3 className="feat-title">Inline code comments</h3>
            <p className="feat-desc">
              Every issue gets pinned to the exact line. Sniff writes clear,
              actionable comments so developers know exactly what to fix and
              why.
            </p>
            <span className="feat-tag">Line-level precision</span>
          </div>

          <div className="feat-card">
            <div className="feat-icon feat-icon-yellow">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M10 3v4M10 13v4M3 10h4M13 10h4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <circle
                  cx="10"
                  cy="10"
                  r="2.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
            <h3 className="feat-title">Context-aware analysis</h3>
            <p className="feat-desc">
              Sniff understands your codebase — it reads surrounding files,
              commit history, and PR description to give reviews that actually
              make sense.
            </p>
            <span className="feat-tag">Repo-aware</span>
          </div>

          <div className="feat-card">
            <div className="feat-icon feat-icon-green">
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
            </div>
            <h3 className="feat-title">Merge confidence score</h3>
            <p className="feat-desc">
              Each PR gets a confidence score from Sniff — a clear signal that
              tells your team whether it&apos;s safe to ship, needs work, or
              requires a human eye.
            </p>
            <span className="feat-tag">Risk scoring</span>
          </div>
        </div>

        <button className="btn-features">Get Started</button>
      </section>

      {/* ── Footer ── */}
      <footer className="site-footer">
        <div className="footer-top">
          <div className="footer-grid-texture" />

          <div className="footer-sticker footer-sticker-left">
            <span className="sticker-inner sticker-green">
              Open
              <br />
              Source ✦
            </span>
          </div>
          <div className="footer-sticker footer-sticker-right">
            <span className="sticker-inner sticker-burst">
              Free
              <br />
              Trial!
            </span>
          </div>

          <a href="#" className="footer-cta">
            Start reviewing PRs
          </a>

          <svg
            className="footer-wave"
            viewBox="0 0 1440 72"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0,32 C120,64 240,0 360,32 C480,64 600,0 720,32 C840,64 960,0 1080,32 C1200,64 1320,0 1440,32 L1440,72 L0,72 Z"
              fill="#fdf6f0"
            />
          </svg>
        </div>

        <div className="footer-bottom">
          <div className="footer-mascot">
            <Image
              src="/uploads/mascot.png"
              alt="Sniff mascot"
              width={120}
              height={120}
            />
          </div>

          <div className="footer-logo">Sniff</div>

          <p className="footer-tagline">
            Your AI agent that reviews every PR before humans do.
          </p>

          <div className="footer-team">
            {teamMembers.map((member) => (
              <div key={member.name} className="footer-member">
                <span className="member-name">{member.name}</span>
                <div className="member-links">
                  <a
                    href={member.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${member.name} GitHub`}
                  >
                    <GitHubIcon />
                  </a>
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${member.name} LinkedIn`}
                  >
                    <LinkedInIcon />
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="footer-bar">
            <span>© 2026 Sniff. All rights reserved.</span>
            <span>Built with ♥ by the Sniff team</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
