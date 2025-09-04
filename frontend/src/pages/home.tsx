import './home.css';

export default function Home() {
  return (
    <>
      {/* NAV */}
      <div className="nav">
        <div className="container nav-inner">
          <div className="brand">
            <span className="badge">NC STATE</span>
            <span>University — Senior Design</span>
          </div>
          <div className="links">
            <a href="#features">How It Works</a>
            <a href="#requirements">Requirements</a>
            <a href="#milestones">Milestones</a>
            <a href="#team">Team</a>
          </div>
        </div>
      </div>

      {/* HERO */}
      <header className="container hero">
        <div className="hero-grid">
          <div className="hero-card">
            <h1>Cross-Cultural Negotiation System with LLM Agents</h1>
            <p className="lead">
              Train, benchmark, and deploy culturally-aware AI negotiation agents. Practice human–bot and
              bot–bot scenarios with text and voice, real-time visualization, and research-ready logging.
            </p>
            <div className="cta">
              <a className="btn primary" href="#milestones">View Milestones</a>
              <a className="btn" href="#requirements">See Requirements</a>
            </div>
          </div>

          <div className="pills">
            <span className="pill">LLM Agents • OpenAI API</span>
            <span className="pill">Text &amp; Voice • Real-time GUI</span>
            <span className="pill">Experiment Logging • Analytics</span>
          </div>
        </div>
      </header>

      {/* HOW IT WORKS */}
      <section id="features" className="container section">
        <h2 className="title">How It Works</h2>
        <p className="muted">Step-by-step view aligned with milestones.</p>

        <div className="steps">
          <div className="step-box">
            <div className="badge-num">1</div>
            <div className="step-title">Bot–Bot Negotiation (Text vs. Text)</div>
            <p className="muted">
              Two LLM agents with distinct cultural profiles negotiate simulated scenarios
              (e.g., salary/benefits, school cellphone policy). The GUI visualizes rounds,
              outcomes, winners, offer types, and deadlocks.
            </p>
          </div>

          <div className="step-box">
            <div className="badge-num">2</div>
            <div className="step-title">Human–Bot (Voice vs. Text)</div>
            <p className="muted">
              Adapt one agent to allow human participation via text with optional voice input
              (speech-to-text). Compare outcomes vs. bot–bot and iterate for research goals.
            </p>
          </div>

          <div className="step-box">
            <div className="badge-num">3</div>
            <div className="step-title">Real-Time Multimodal (Voice vs. Voice)</div>
            <p className="muted">
              Enable two-way synchronous voice conversation. Provide advanced visualization
              of negotiation/deliberation flow and ensure scalability for classroom and external deployments.
            </p>
          </div>

          <div className="step-box">
            <div className="badge-num">4</div>
            <div className="step-title">Logging, Stats &amp; Archival</div>
            <p className="muted">
              Archive runtime results and output statistics: number of rounds, success rate,
              deadlocks, offer types, and winners—enabling benchmarking and reproducible studies.
            </p>
          </div>
        </div>
      </section>

      {/* REQUIREMENTS */}
      <section id="requirements" className="container section">
        <h2 className="title">Key Project Requirements</h2>
        <div className="card">
          <div className="grid-2">
            <ul>
              <li>Invoke LLM APIs (e.g., OpenAI) to create working negotiation agents.</li>
              <li>GUIs that reflect, in real time, the negotiation process.</li>
              <li>Output statistics and archive runtime results.</li>
            </ul>
            <ul>
              <li>Support speech-to-text input for human users.</li>
              <li>Respond via both text and voice.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* MILESTONES */}
      <section id="milestones" className="container section">
        <h2 className="title">Milestones &amp; Timeline</h2>
        <div className="chips">
          <div className="chip">
            <span className="when">End of Month 2</span>
            <span>Milestone 1 — Bot–Bot Platform with GUI</span>
          </div>
          <div className="chip">
            <span className="when">End of Fall</span>
            <span>Milestone 2 — Human–Bot (Voice vs. Text)</span>
          </div>
          <div className="chip">
            <span className="when">Spring Midterm</span>
            <span>Milestone 3 — Real-Time (Voice vs. Voice)</span>
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section id="team" className="container section">
        <h2 className="title">Sponsor &amp; Mentor</h2>
        <div className="grid-2">
          <div className="card">
            <h3 style={{ margin: "0 0 0.5rem 0" }}>Sponsor</h3>
            <p className="muted" style={{ margin: 0 }}>
              <strong>Individual NC State Faculty</strong><br />
              <a href="mailto:chauwai.wong@ncsu.edu">chauwai.wong@ncsu.edu</a>
            </p>
          </div>
          <div className="card">
            <h3 style={{ margin: "0 0 0.5rem 0" }}>Mentor</h3>
            <p className="muted" style={{ margin: 0 }}>
              <strong>Chau-Wai Wong</strong> (weekly), collaborator (monthly)<br />
              <a href="mailto:chauwai.wong@ncsu.edu">chauwai.wong@ncsu.edu</a><br />
              <em>Meetings:</em> Weekly in-person (Zoom backup), Discord for Q&amp;A
            </p>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="container section">
        <h2 className="title">Early Targets</h2>
        <div className="stats">
          <div className="stat">
            <div className="n">2+</div>
            <div className="muted">Agent Profiles (init)</div>
          </div>
          <div className="stat">
            <div className="n">5+</div>
            <div className="muted">Negotiation Scenarios</div>
          </div>
          <div className="stat">
            <div className="n">100+</div>
            <div className="muted">Logged Rounds (pilot)</div>
          </div>
        </div>
      </section>

      <footer className="container">
        © {new Date().getFullYear()} NC State University — Cross-Cultural Negotiation System
      </footer>
    </>
  );
}
