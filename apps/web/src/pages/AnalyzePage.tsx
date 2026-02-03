import { useState } from "react";
import styles from "../App.module.scss";

const API_BASE = "/api";

interface ContactData {
  emails: string[];
  phones: string[];
  socialLinks: Record<string, string>;
}

interface TechStack {
  hints: string[];
  generator?: string;
}

interface PerformanceMetrics {
  mobileScore: number;
  lcp?: number;
  cls?: number;
  tbt?: number;
}

interface SiteClassification {
  siteType: string;
  industry?: string;
  confidence: number;
}

interface UpgradeOpportunity {
  id: string;
  title: string;
  issue: string;
  businessImpact: string;
  suggestedFix: string;
  pitchAngle: string;
  confidence: string;
}

interface AnalysisResult {
  url: string;
  analyzedAt: string;
  contact: ContactData;
  techStack: TechStack;
  performance: PerformanceMetrics;
  classification: SiteClassification;
  opportunities: UpgradeOpportunity[];
  meta?: { scrapeDurationMs?: number; cacheHit?: boolean };
}

export default function AnalyzePage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function copyPitch(angle: string, id: string) {
    navigator.clipboard.writeText(angle);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <>
      <form onSubmit={handleSubmit} className={styles.form}>
        <label htmlFor="url" className={styles.srOnly}>
          Website URL
        </label>
        <div className={styles.formRow}>
          <input
            id="url"
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className={styles.input}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className={`${styles.btn} ${styles.btnPrimary}`}
          >
            {loading ? "Analyzing…" : "Analyze"}
          </button>
        </div>
      </form>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {result && (
        <div className={styles.result}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Site</h2>
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              {result.url}
            </a>
            {result.meta?.cacheHit && (
              <span className={styles.linkMuted}>(cached)</span>
            )}
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Contact</h2>
            <div className={styles.contactList}>
              {result.contact.emails.length > 0 && (
                <p>Emails: {result.contact.emails.join(", ")}</p>
              )}
              {result.contact.phones.length > 0 && (
                <p>Phones: {result.contact.phones.join(", ")}</p>
              )}
              {Object.keys(result.contact.socialLinks).length > 0 && (
                <p>
                  Social:{" "}
                  {Object.entries(result.contact.socialLinks).map(([k, v]) => (
                    <a
                      key={k}
                      href={v}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.link}
                    >
                      {k}
                    </a>
                  ))}
                </p>
              )}
              {result.contact.emails.length === 0 &&
                result.contact.phones.length === 0 &&
                Object.keys(result.contact.socialLinks).length === 0 && (
                  <p className={styles.noData}>No contact data extracted.</p>
                )}
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Tech &amp; performance</h2>
            <div className={styles.techList}>
              <p>Tech: {result.techStack.hints.join(", ")}</p>
              <p>
                Type: {result.classification.siteType} (confidence{" "}
                {result.classification.confidence})
              </p>
              <p>
                Mobile score: {result.performance.mobileScore}/100
                {result.performance.lcp != null &&
                  ` · LCP ~${result.performance.lcp}s`}
                {result.performance.tbt != null &&
                  ` · TBT ${result.performance.tbt}ms`}
              </p>
            </div>
          </section>

          <section className={styles.section}>
            <h2
              className={`${styles.sectionTitle} ${styles.sectionTitleSpaced}`}
            >
              Upgrade opportunities &amp; pitch angles
            </h2>
            <div className={styles.opportunitiesList}>
              {result.opportunities.map((opp) => (
                <div key={opp.id} className={styles.opportunityCard}>
                  <h3 className={styles.opportunityCardTitle}>{opp.title}</h3>
                  <p className={styles.opportunityCardText}>{opp.issue}</p>
                  <p
                    className={`${styles.opportunityCardText} ${styles.opportunityCardTextMuted}`}
                  >
                    {opp.businessImpact}
                  </p>
                  <p
                    className={`${styles.opportunityCardText} ${styles.opportunityCardTextMuted}`}
                  >
                    Fix: {opp.suggestedFix}
                  </p>
                  <div className={styles.pitchRow}>
                    <blockquote className={styles.pitchQuote}>
                      {opp.pitchAngle}
                    </blockquote>
                    <button
                      type="button"
                      onClick={() => copyPitch(opp.pitchAngle, opp.id)}
                      className={`${styles.btn} ${styles.btnCopy}`}
                    >
                      {copiedId === opp.id ? "Copied" : "Copy pitch"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
