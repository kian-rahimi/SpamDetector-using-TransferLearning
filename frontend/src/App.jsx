import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const examples = [
  {
    label: "Likely spam",
    text: "Congratulations! You have won a £1,000 cash prize. Call now to claim.",
  },
  {
    label: "Likely ham",
    text: "Hey, are we still meeting at the library at 4pm today?",
  },
  {
    label: "Try this one",
    text: "URGENT! Your mobile number was selected for a free holiday. Reply YES.",
  },
];

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 5 6v5c0 4.8 2.9 8.1 7 10 4.1-1.9 7-5.2 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 3 1.3 4.7L18 9l-4.7 1.3L12 15l-1.3-4.7L6 9l4.7-1.3L12 3Z" />
      <path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14M14 7l5 5-5 5" />
    </svg>
  );
}

function App() {
  const [message, setMessage] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modelReady, setModelReady] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/health`)
      .then((response) => {
        if (!response.ok) throw new Error("API unavailable");
        return response.json();
      })
      .then((data) => setModelReady(data.model_ready))
      .catch(() => setModelReady(false));
  }, []);

  async function analyzeMessage(event) {
    event.preventDefault();
    if (!message.trim()) {
      setError("Enter a message before analyzing it.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "The message could not be analyzed.");
      }
      setResult(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  function useExample(text) {
    setMessage(text);
    setResult(null);
    setError("");
  }

  const spamPercent = result ? Math.round(result.probabilities.spam * 100) : 0;
  const confidencePercent = result ? Math.round(result.confidence * 100) : 0;

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="MessageGuard home">
          <span className="brand-mark"><ShieldIcon /></span>
          <span>Message<span>Guard</span></span>
        </a>
        <div className={`status ${modelReady ? "ready" : "waiting"}`}>
          <span className="status-dot" />
          {modelReady === null
            ? "Checking model"
            : modelReady
              ? "Model ready"
              : "Model not loaded"}
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="eyebrow"><SparkIcon /> Powered by DistilBERT</div>
          <h1>Know what’s spam.<br /><span>Before you click.</span></h1>
          <p className="hero-copy">
            Paste any SMS message and let our fine-tuned AI spot suspicious content
            in seconds. Fast, private, and easy to understand.
          </p>
        </section>

        <section className="detector-grid" aria-label="Spam message detector">
          <form className="analyzer-card" onSubmit={analyzeMessage}>
            <div className="card-heading">
              <div>
                <span className="step-label">01 / MESSAGE</span>
                <h2>What did you receive?</h2>
              </div>
              <span className="character-count">{message.length} / 5,000</span>
            </div>

            <label className="sr-only" htmlFor="message">SMS message</label>
            <textarea
              id="message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={5000}
              placeholder="Paste or type a suspicious message here…"
            />

            <div className="example-row">
              <span>Try an example:</span>
              <div>
                {examples.map((example) => (
                  <button
                    className="example-chip"
                    key={example.label}
                    type="button"
                    onClick={() => useExample(example.text)}
                  >
                    {example.label}
                  </button>
                ))}
              </div>
            </div>

            {error && <div className="error-message" role="alert">{error}</div>}

            <button className="analyze-button" type="submit" disabled={loading}>
              {loading ? <span className="spinner" /> : <SparkIcon />}
              {loading ? "Analyzing message…" : "Analyze message"}
              {!loading && <ArrowIcon />}
            </button>
          </form>

          <aside className={`result-card ${result ? "has-result" : ""}`} aria-live="polite">
            {!result ? (
              <div className="empty-result">
                <div className="radar">
                  <span /><span /><span />
                  <ShieldIcon />
                </div>
                <span className="step-label">02 / RESULT</span>
                <h2>Your result will appear here</h2>
                <p>Enter a message and press analyze. The model will show its prediction and confidence.</p>
              </div>
            ) : (
              <div className="result-content">
                <span className="step-label">02 / RESULT</span>
                <div className={`verdict-icon ${result.is_spam ? "spam" : "ham"}`}>
                  {result.is_spam ? "!" : "✓"}
                </div>
                <p className="verdict-kicker">This message looks like</p>
                <h2 className={result.is_spam ? "spam-text" : "ham-text"}>{result.label}</h2>
                <p className="confidence-copy">{confidencePercent}% model confidence</p>

                <div className="meter-block">
                  <div className="meter-labels"><span>Ham</span><span>Spam</span></div>
                  <div className="meter"><span style={{ width: `${spamPercent}%` }} /></div>
                  <div className="meter-values">
                    <span>{Math.round(result.probabilities.ham * 100)}%</span>
                    <span>{spamPercent}%</span>
                  </div>
                </div>

                <button className="reset-button" type="button" onClick={() => {
                  setMessage("");
                  setResult(null);
                }}>
                  Check another message
                </button>
              </div>
            )}
          </aside>
        </section>

        <section className="how-it-works">
          <div className="section-intro">
            <span className="step-label">UNDER THE HOOD</span>
            <h2>Transfer learning,<br />made practical.</h2>
            <p>We start with a language model that already understands English, then teach it the patterns of SMS spam.</p>
          </div>
          <div className="process-list">
            <article><span>1</span><div><h3>Pretrained language model</h3><p>DistilBERT brings knowledge learned from a large collection of text.</p></div></article>
            <article><span>2</span><div><h3>Fine-tuned on real SMS</h3><p>The UCI SMS Spam Collection teaches the model the difference between ham and spam.</p></div></article>
            <article><span>3</span><div><h3>Instant classification</h3><p>FastAPI serves the model and returns both a label and probability scores.</p></div></article>
          </div>
        </section>
      </main>

      <footer>
        <div className="brand"><span className="brand-mark"><ShieldIcon /></span><span>Message<span>Guard</span></span></div>
        <p>Built for learning · DistilBERT + FastAPI + React</p>
      </footer>
    </div>
  );
}

export default App;

