import VideoBackground from "./VideoBackground";

export default function HeroSection() {
  return (
    <div className="scene">
      <VideoBackground />

      <nav>
        <div className="nav-inner">
          <a href="#" className="logo">Sniff</a>

          <ul className="nav-links">
            <li><a href="#" className="nav-active">Home</a></li>
            <li><a href="#features">Features</a></li>
            <li><a href="#about">How it works</a></li>
            <li><a href="#">Pricing</a></li>
            <li><a href="#">Docs</a></li>
          </ul>

          <a href="/review" className="btn-nav">Trial</a>
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

        <a href="/review" className="btn-hero animate-fade-rise-delay-2">Try it free →</a>

        <div className="hero-rule animate-fade-rise-delay-2">
          <span className="r1" />
          <span className="r2" />
          <span className="r3" />
          <span className="r4" />
        </div>
      </section>
    </div>
  );
}
