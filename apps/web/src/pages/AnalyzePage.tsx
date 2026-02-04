import { useState } from "react";
import styles from "../App.module.scss";

const API_BASE = "/api";

const SOCIAL_ICONS: Record<
  string,
  { viewBox: string; path: string; title: string }
> = {
  facebook: {
    viewBox: "0 0 24 24",
    title: "Facebook",
    path:
      "M22.675 0h-21.35C.597 0 0 .597 0 1.326v21.348C0 23.403.597 24 1.325 24H12.82v-9.294H9.692V11.01h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.31h3.587l-.467 3.696h-3.12V24h6.116C23.403 24 24 23.403 24 22.674V1.326C24 .597 23.403 0 22.675 0z",
  },
  twitter: {
    viewBox: "0 0 24 24",
    title: "Twitter",
    path:
      "M23.954 4.569c-.885.389-1.83.654-2.825.775 1.014-.611 1.794-1.574 2.163-2.724-.949.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-2.723 0-4.928 2.206-4.928 4.93 0 .39.045.765.127 1.124-4.094-.205-7.725-2.165-10.157-5.144-.424.722-.666 1.561-.666 2.475 0 1.71.87 3.213 2.188 4.096-.807-.026-1.566-.248-2.229-.616v.061c0 2.385 1.693 4.374 3.946 4.827-.413.111-.849.171-1.296.171-.314 0-.615-.03-.916-.086.631 1.953 2.445 3.377 4.604 3.419-1.68 1.319-3.809 2.105-6.102 2.105-.39 0-.779-.023-1.17-.067 2.189 1.394 4.768 2.209 7.557 2.209 9.054 0 14.001-7.496 14.001-13.986 0-.209 0-.42-.016-.63.961-.689 1.8-1.56 2.46-2.548z",
  },
  linkedin: {
    viewBox: "0 0 24 24",
    title: "LinkedIn",
    path:
      "M22.23 0H1.77C.79 0 0 .774 0 1.727v20.545C0 23.227.79 24 1.77 24h20.46C23.2 24 24 23.227 24 22.273V1.727C24 .774 23.2 0 22.23 0zM7.09 20.452H3.56V9h3.53v11.452zM5.325 7.433a2.044 2.044 0 1 1 0-4.087 2.044 2.044 0 0 1 0 4.087zM20.452 20.452h-3.53v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.446-2.136 2.94v5.666h-3.53V9h3.39v1.561h.047c.472-.9 1.624-1.852 3.344-1.852 3.576 0 4.236 2.354 4.236 5.412v6.331z",
  },
  instagram: {
    viewBox: "0 0 24 24",
    title: "Instagram",
    path:
      "M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.34 3.608 1.316.975.975 1.253 2.242 1.315 3.608.058 1.266.07 1.646.07 4.843 0 3.204-.012 3.584-.07 4.85-.062 1.366-.34 2.633-1.315 3.608-.975.975-2.242 1.253-3.608 1.315-1.266.058-1.646.07-4.85.07-3.197 0-3.577-.012-4.843-.07-1.366-.062-2.633-.34-3.608-1.315-.976-.975-1.254-2.242-1.316-3.608-.058-1.266-.07-1.646-.07-4.85 0-3.197.012-3.577.07-4.843.062-1.366.34-2.633 1.316-3.608.975-.976 2.242-1.254 3.608-1.316 1.266-.058 1.646-.07 4.843-.07m0-2.163C8.741 0 8.332.013 7.052.072 5.773.131 4.602.425 3.608 1.419 2.614 2.413 2.32 3.584 2.261 4.863 2.202 6.143 2.189 6.552 2.189 12c0 5.448.013 5.857.072 7.137.059 1.279.353 2.45 1.347 3.444.994.994 2.165 1.288 3.444 1.347 1.28.059 1.689.072 7.137.072 5.448 0 5.857-.013 7.137-.072 1.279-.059 2.45-.353 3.444-1.347.994-.994 1.288-2.165 1.347-3.444.059-1.28.072-1.689.072-7.137 0-5.448-.013-5.857-.072-7.137-.059-1.279-.353-2.45-1.347-3.444-.994-.994-2.165-1.288-3.444-1.347C15.857.013 15.448 0 12 0zM12 5.838A6.162 6.162 0 1 0 12 18.162 6.162 6.162 0 0 0 12 5.838zm0 10.163A4.001 4.001 0 1 1 12 7.999a4.001 4.001 0 0 1 0 8.002zm6.406-11.845a1.44 1.44 0 1 1-2.881 0 1.44 1.44 0 0 1 2.881 0z",
  },
  youtube: {
    viewBox: "0 0 24 24",
    title: "YouTube",
    path:
      "M23.498 6.186a2.985 2.985 0 0 0-2.1-2.11C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.398.576a2.985 2.985 0 0 0-2.1 2.11C0 8.093 0 12 0 12s0 3.907.502 5.814a2.985 2.985 0 0 0 2.1 2.11C4.5 20.5 12 20.5 12 20.5s7.5 0 9.398-.576a2.985 2.985 0 0 0 2.1-2.11C24 15.907 24 12 24 12s0-3.907-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
  },
  tiktok: {
    viewBox: "0 0 24 24",
    title: "TikTok",
    path:
      "M12.636 1c.448 3.832 2.576 5.96 6.364 6.364v3.155c-2.1.07-3.86-.62-5.364-1.727v6.636c0 3.28-2.327 5.572-5.636 5.572-3.1 0-5.636-2.48-5.636-5.572 0-3.124 2.567-5.636 5.727-5.636.248 0 .496.018.737.055v3.182a2.39 2.39 0 0 0-.737-.112c-1.33 0-2.418 1.08-2.418 2.511 0 1.428 1.08 2.5 2.418 2.5 1.47 0 2.455-.94 2.455-2.727V1h2.09z",
  },
};

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
  mobileScore: number | null;
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
  meta?: {
    scrapeDurationMs?: number;
    cacheHit?: boolean;
    overallScore?: number;
    scores?: {
      performance: number;
      style: number;
      responsive: number;
      content: number;
      overall: number;
    };
  };
}

export default function AnalyzePage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(null);

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
      setSelectedOpportunityId(data.opportunities?.[0]?.id ?? null);
      setCopiedId(null);
      setUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function copyPitch(angle: string, id: string | null) {
    try {
      await navigator.clipboard.writeText(angle);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError("Unable to copy pitch");
    }
  }

  const selectedOpportunity =
    result?.opportunities.find((opp) => opp.id === selectedOpportunityId) ??
    result?.opportunities[0] ??
    null;

  function handleRowSelect(id: string) {
    setSelectedOpportunityId(id);
    setCopiedId(null);
  }

  const metaScores = result?.meta?.scores;

  const scoreValues = {
    overall:
      metaScores?.overall ??
      (typeof result?.meta?.overallScore === "number"
        ? result.meta.overallScore
        : null),
    performance:
      metaScores?.performance ??
      (typeof result?.performance.mobileScore === "number"
        ? result.performance.mobileScore
        : null),
    style: metaScores?.style ?? null,
    responsive: metaScores?.responsive ?? null,
    content:
      metaScores?.content ??
      (result ? Math.round(result.classification.confidence * 100) : null),
  };

  const keyScoreParts = [
    scoreValues.overall != null
      ? `Overall ${Math.round(scoreValues.overall)}/100`
      : null,
    scoreValues.performance != null
      ? `Perf ${Math.round(scoreValues.performance)}/100`
      : null,
    scoreValues.style != null
      ? `Style ${Math.round(scoreValues.style)}/100`
      : null,
    scoreValues.responsive != null
      ? `Resp ${Math.round(scoreValues.responsive)}/100`
      : null,
    scoreValues.content != null
      ? `Content ${Math.round(scoreValues.content)}/100`
      : null,
  ].filter(Boolean) as string[];

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
                <div className={styles.socialLinks}>
                  <span>
                    {Object.keys(result.contact.socialLinks).length > 1 ? 'Socials' : 'Social'}:
                  </span>
                  <div className={styles.socialIcons}>
                    {Object.entries(result.contact.socialLinks).map(([k, v]) => {
                      const icon = SOCIAL_ICONS[k.toLowerCase()];
                      return (
                        <a
                          key={k}
                          href={v}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.socialIconLink}
                          aria-label={icon?.title ?? k}
                          title={icon?.title ?? k}
                        >
                          {icon ? (
                            <svg
                              className={styles.socialIcon}
                              viewBox={icon.viewBox}
                              aria-hidden="true"
                            >
                              <path d={icon.path} />
                            </svg>
                          ) : (
                            <span>{k}</span>
                          )}
                        </a>
                      );
                    })}
                  </div>
                </div>
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
                Mobile score: {result.performance.mobileScore != null ? `${result.performance.mobileScore}/100` : "— (no data)"}
                {result.performance.lcp != null &&
                  ` · LCP ~${result.performance.lcp}s`}
                {result.performance.tbt != null &&
                  ` · TBT ${result.performance.tbt}ms`}
              </p>
              {keyScoreParts.length > 0 && (
                <p>{keyScoreParts.join(" · ")}</p>
              )}
            </div>
          </section>

          <section className={styles.section}>
            <h2
              className={`${styles.sectionTitle} ${styles.sectionTitleSpaced}`}
            >
              Reachout message
            </h2>
            {selectedOpportunity ? (
              <div className={styles.messageBox}>
                <div className={styles.messageBody}>
                  {selectedOpportunity.pitchAngle}
                </div>
                <div className={styles.messageMetaRow}>
                  <span className={styles.messageMeta}>
                    Focus: {selectedOpportunity.title} · Confidence{" "}
                    {selectedOpportunity.confidence}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyPitch(
                        selectedOpportunity.pitchAngle,
                        selectedOpportunity.id
                      )
                    }
                    className={`${styles.btn} ${styles.btnCopy}`}
                  >
                    {copiedId === selectedOpportunity.id
                      ? "Copied"
                      : "Copy message"}
                  </button>
                </div>
              </div>
            ) : (
              <p className={styles.noData}>
                No AI message generated for this site.
              </p>
            )}
          </section>

          <section className={styles.section}>
            <h2
              className={`${styles.sectionTitle} ${styles.sectionTitleSpaced}`}
            >
              Advice &amp; score table
            </h2>
            <div className={styles.tableWrapper}>
              <table className={styles.adviceTable}>
                <thead>
                  <tr>
                    <th scope="col">Focus</th>
                    <th scope="col">Issue summary</th>
                    <th scope="col">Business impact</th>
                    <th scope="col">Recommended fix</th>
                    <th scope="col">Key scores</th>
                  </tr>
                </thead>
                <tbody>
                  {result.opportunities.length > 0 ? (
                    result.opportunities.map((opp) => (
                      <tr
                        key={opp.id}
                        className={
                          selectedOpportunity?.id === opp.id
                            ? styles.tableRowActive
                            : undefined
                        }
                        onClick={() => handleRowSelect(opp.id)}
                        onKeyDown={(evt) => {
                          if (evt.key === "Enter" || evt.key === " ") {
                            evt.preventDefault();
                            handleRowSelect(opp.id);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-pressed={selectedOpportunity?.id === opp.id}
                      >
                        <td>{opp.title}</td>
                        <td>{opp.issue}</td>
                        <td>{opp.businessImpact}</td>
                        <td>{opp.suggestedFix}</td>
                        <td>{keyScoreParts.length > 0 ? keyScoreParts.join(" · ") : "—"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className={styles.noData}>
                        No advice available for this site.
                      </td>
                    </tr>
                  )}
                </tbody>
                {(scoreValues.overall != null ||
                  scoreValues.performance != null ||
                  scoreValues.responsive != null ||
                  scoreValues.content != null) && (
                  <tfoot>
                    <tr>
                      <th scope="row">Performance details</th>
                      <td colSpan={4}>
                        {result.performance.mobileScore != null
                          ? `Mobile score ${result.performance.mobileScore}/100 · LCP ${
                              result.performance.lcp ?? "—"
                            }s · TBT ${result.performance.tbt ?? "—"}ms`
                          : "No reliable PageSpeed data"}
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">Responsive score</th>
                      <td colSpan={4}>
                        {scoreValues.responsive != null
                          ? `${Math.round(scoreValues.responsive)}/100`
                          : "—"}
                        {" · "}
                        Content confidence{" "}
                        {Math.round(result.classification.confidence * 100)}/100
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">Overall score</th>
                      <td colSpan={4}>
                        {scoreValues.overall != null
                          ? `${Math.round(scoreValues.overall)}/100`
                          : "—"}
                        {" · "}
                        Style{" "}
                        {scoreValues.style != null
                          ? `${Math.round(scoreValues.style)}/100`
                          : "—"}
                        {" · "}
                        Content{" "}
                        {scoreValues.content != null
                          ? `${Math.round(scoreValues.content)}/100`
                          : "—"}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
