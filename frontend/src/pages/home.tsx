/**
 * Cross-Cultural Negotiation System — NC State themed landing page
 * Simplified responsive design with natural scaling
 */

export default function Home() {
    return (
      <>
        <style>{`
          :root{
            --wolfpack: #CC0000;
            --wolfpack-dark: #990000;
            --bg: #0b1020;
            --panel: #0f1328;
            --panel-soft: #161b36;
            --ink: #e8edf9;
            --muted: #a7b0c6;
            --ring: rgba(204,0,0,.35);
            --radius: 12px;
            --shadow: 0 8px 25px rgba(0,0,0,.2);
          }
          
          * { box-sizing: border-box; }
          
          html, body, #root { height: 100%; }
          
          body {
            margin: 0;
            background: radial-gradient(1200px 800px at 20% -10%, #131b3a 0%, var(--bg) 60%) no-repeat, var(--bg);
            color: var(--ink);
            font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Inter, Roboto, "Helvetica Neue", Arial;
            font-size: 16px;
            line-height: 1.6;
          }
          
          a {
            color: #e7f0ff;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
  
          .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
          }
  
          /* Navigation */
          .nav {
            position: sticky;
            top: 0;
            z-index: 50;
            background: linear-gradient(90deg, #0c122a, #1b2146);
            border-bottom: 1px solid rgba(255,255,255,.08);
            backdrop-filter: blur(6px);
          }
          
          .nav-inner {
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          
          .brand {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-weight: 900;
            font-size: 0.95rem;
          }
          
          .badge {
            background: #fff;
            color: var(--wolfpack);
            padding: 0.25rem 0.6rem;
            border-radius: 6px;
            font-size: 0.8rem;
          }
          
          .links {
            display: flex;
            gap: 2rem;
          }
          
          .links a {
            font-weight: 600;
            opacity: 0.9;
            transition: opacity 0.2s;
          }
          
          .links a:hover {
            opacity: 0.7;
          }
  
          /* Hero Section */
          .hero {
            padding: 4rem 0;
          }
          
          .hero-grid {
            display: grid;
            grid-template-columns: 1.3fr 1fr;
            gap: 2rem;
            align-items: start;
          }
          
          .hero-card {
            background: linear-gradient(180deg, #0f1a33, #0b122b);
            border: 1px solid rgba(255,255,255,.1);
            border-radius: var(--radius);
            padding: 2rem;
            box-shadow: var(--shadow);
          }
          
          h1 {
            margin: 0 0 1rem;
            font-size: 2.5rem;
            line-height: 1.1;
            font-weight: 800;
          }
          
          .lead {
            color: #cbd5e1;
            margin: 0 0 1.5rem;
            font-size: 1.1rem;
          }
          
          .cta {
            display: flex;
            gap: 1rem;
          }
  
          .btn {
            display: inline-block;
            padding: 0.75rem 1.25rem;
            border-radius: 8px;
            font-weight: 700;
            border: 1px solid rgba(255,255,255,.12);
            background: #fff;
            color: #0c122b;
            transition: all 0.2s;
          }
          
          .btn.primary {
            background: var(--wolfpack);
            color: #fff;
            border-color: var(--wolfpack);
          }
          
          .btn.primary:hover {
            background: var(--wolfpack-dark);
          }
          
          .btn:focus {
            outline: 3px solid var(--ring);
            outline-offset: 2px;
          }
  
          .pills {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }
          
          .pill {
            background: rgba(255,255,255,.06);
            border: 1px solid rgba(255,255,255,.12);
            border-radius: 50px;
            padding: 0.75rem 1rem;
            font-weight: 700;
            text-align: center;
            box-shadow: var(--shadow);
          }
  
          /* Sections */
          .section {
            padding: 3rem 0;
          }
          
          .title {
            font-size: 1.75rem;
            margin: 0 0 0.5rem;
            font-weight: 700;
          }
          
          .muted {
            color: var(--muted);
          }
  
          .card {
            background: var(--panel);
            border: 1px solid rgba(255,255,255,.1);
            border-radius: var(--radius);
            padding: 1.5rem;
            box-shadow: var(--shadow);
          }
  
          /* Steps */
          .steps {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            margin-top: 2rem;
          }
          
          .step-box {
            position: relative;
            background: var(--panel-soft);
            border: 1px solid rgba(255,255,255,.12);
            border-radius: var(--radius);
            padding: 1.5rem;
            padding-left: 4rem;
          }
          
          .badge-num {
            position: absolute;
            left: 1rem;
            top: 1.25rem;
            width: 2.5rem;
            height: 2.5rem;
            border-radius: 50%;
            background: var(--wolfpack);
            color: #fff;
            font-weight: 900;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: var(--shadow);
          }
          
          .step-title {
            margin: 0 0 0.5rem;
            font-weight: 800;
            font-size: 1.1rem;
          }
  
          /* Grid layouts */
          .grid-2 {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
          }
  
          /* Timeline */
          .chips {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            margin-top: 1.5rem;
          }
          
          .chip {
            display: flex;
            gap: 1rem;
            align-items: center;
            background: #0f1328;
            border: 1px solid rgba(255,255,255,.08);
            border-left: 4px solid var(--wolfpack);
            border-radius: 8px;
            padding: 1rem;
          }
          
          .when {
            min-width: 140px;
            color: #cbd5e1;
            font-weight: 700;
            font-size: 0.9rem;
          }
  
          /* Stats */
          .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin-top: 1.5rem;
          }
          
          .stat {
            text-align: center;
            background: var(--panel);
            border: 1px solid rgba(255,255,255,.1);
            border-radius: var(--radius);
            padding: 1.5rem;
          }
          
          .n {
            font-size: 2rem;
            font-weight: 900;
            margin-bottom: 0.5rem;
            color: var(--wolfpack);
          }
  
          footer {
            border-top: 1px solid rgba(255,255,255,.08);
            color: #cbd5e1;
            text-align: center;
            padding: 2rem 0;
            margin-top: 2rem;
          }
  
          /* Mobile responsiveness */
          @media (max-width: 768px) {
            .container {
              padding: 0 15px;
            }
            
            .nav-inner {
              height: 50px;
            }
            
            .brand {
              font-size: 0.85rem;
            }
            
            .links {
              gap: 1rem;
            }
            
            .links a {
              font-size: 0.9rem;
            }
            
            .hero {
              padding: 2rem 0;
            }
            
            .hero-grid {
              grid-template-columns: 1fr;
              gap: 1.5rem;
            }
            
            h1 {
              font-size: 2rem;
            }
            
            .lead {
              font-size: 1rem;
            }
            
            .cta {
              flex-direction: column;
            }
            
            .btn {
              text-align: center;
            }
            
            .step-box {
              padding: 1rem;
              padding-left: 3rem;
            }
            
            .badge-num {
              left: 0.5rem;
              top: 1rem;
              width: 2rem;
              height: 2rem;
              font-size: 0.9rem;
            }
            
            .chip {
              flex-direction: column;
              align-items: flex-start;
              gap: 0.5rem;
            }
            
            .when {
              min-width: auto;
            }
          }
        `}</style>
  
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
              <h3 style={{margin:"0 0 0.5rem 0"}}>Sponsor</h3>
              <p className="muted" style={{margin:0}}>
                <strong>Individual NC State Faculty</strong><br/>
                <a href="mailto:chauwai.wong@ncsu.edu">chauwai.wong@ncsu.edu</a>
              </p>
            </div>
            <div className="card">
              <h3 style={{margin:"0 0 0.5rem 0"}}>Mentor</h3>
              <p className="muted" style={{margin:0}}>
                <strong>Chau-Wai Wong</strong> (weekly), collaborator (monthly)<br/>
                <a href="mailto:chauwai.wong@ncsu.edu">chauwai.wong@ncsu.edu</a><br/>
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