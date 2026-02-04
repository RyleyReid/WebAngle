import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import styles from "../App.module.scss";

const API_BASE = "/api";

const SOCIAL_ICONS: Record<
  string,
  { viewBox: string; path: string; title: string }
> = {
  facebook: { viewBox: "0 0 24 24", title: "Facebook", path: "M22.675 0h-21.35C.597 0 0 .597 0 1.326v21.348C0 23.403.597 24 1.325 24H12.82v-9.294H9.692V11.01h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.31h3.587l-.467 3.696h-3.12V24h6.116C23.403 24 24 23.403 24 22.674V1.326C24 .597 23.403 0 22.675 0z" },
  twitter: { viewBox: "0 0 24 24", title: "Twitter", path: "M23.954 4.569c-.885.389-1.83.654-2.825.775 1.014-.611 1.794-1.574 2.163-2.724-.949.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-2.723 0-4.928 2.206-4.928 4.93 0 .39.045.765.127 1.124-4.094-.205-7.725-2.165-10.157-5.144-.424.722-.666 1.561-.666 2.475 0 1.71.87 3.213 2.188 4.096-.807-.026-1.566-.248-2.229-.616v.061c0 2.385 1.693 4.374 3.946 4.827-.413.111-.849.171-1.296.171-.314 0-.615-.03-.916-.086.631 1.953 2.445 3.377 4.604 3.419-1.68 1.319-3.809 2.105-6.102 2.105-.39 0-.779-.023-1.17-.067 2.189 1.394 4.768 2.209 7.557 2.209 9.054 0 14.001-7.496 14.001-13.986 0-.209 0-.42-.016-.63.961-.689 1.8-1.56 2.46-2.548z" },
  linkedin: { viewBox: "0 0 24 24", title: "LinkedIn", path: "M22.23 0H1.77C.79 0 0 .774 0 1.727v20.545C0 23.227.79 24 1.77 24h20.46C23.2 24 24 23.227 24 22.273V1.727C24 .774 23.2 0 22.23 0zM7.09 20.452H3.56V9h3.53v11.452zM5.325 7.433a2.044 2.044 0 1 1 0-4.087 2.044 2.044 0 0 1 0 4.087zM20.452 20.452h-3.53v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.446-2.136 2.94v5.666h-3.53V9h3.39v1.561h.047c.472-.9 1.624-1.852 3.344-1.852 3.576 0 4.236 2.354 4.236 5.412v6.331z" },
  instagram: { viewBox: "0 0 24 24", title: "Instagram", path: "M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.34 3.608 1.316.975.975 1.253 2.242 1.315 3.608.058 1.266.07 1.646.07 4.843 0 3.204-.012 3.584-.07 4.85-.062 1.366-.34 2.633-1.315 3.608-.975.975-2.242 1.253-3.608 1.315-1.266.058-1.646.07-4.85.07-3.197 0-3.577-.012-4.843-.07-1.366-.062-2.633-.34-3.608-1.315-.976-.975-1.254-2.242-1.316-3.608-.058-1.266-.07-1.646-.07-4.85 0-3.197.012-3.577.07-4.843.062-1.366.34-2.633 1.316-3.608.975-.976 2.242-1.254 3.608-1.316 1.266-.058 1.646-.07 4.843-.07m0-2.163C8.741 0 8.332.013 7.052.072 5.773.131 4.602.425 3.608 1.419 2.614 2.413 2.32 3.584 2.261 4.863 2.202 6.143 2.189 6.552 2.189 12c0 5.448.013 5.857.072 7.137.059 1.279.353 2.45 1.347 3.444.994.994 2.165 1.288 3.444 1.347 1.28.059 1.689.072 7.137.072 5.448 0 5.857-.013 7.137-.072 1.279-.059 2.45-.353 3.444-1.347.994-.994 1.288-2.165 1.347-3.444.059-1.28.072-1.689.072-7.137 0-5.448-.013-5.857-.072-7.137-.059-1.279-.353-2.45-1.347-3.444-.994-.994-2.165-1.288-3.444-1.347C15.857.013 15.448 0 12 0zM12 5.838A6.162 6.162 0 1 0 12 18.162 6.162 6.162 0 0 0 12 5.838zm0 10.163A4.001 4.001 0 1 1 12 7.999a4.001 4.001 0 0 1 0 8.002zm6.406-11.845a1.44 1.44 0 1 1-2.881 0 1.44 1.44 0 0 1 2.881 0z" },
  youtube: { viewBox: "0 0 24 24", title: "YouTube", path: "M23.498 6.186a2.985 2.985 0 0 0-2.1-2.11C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.398.576a2.985 2.985 0 0 0-2.1 2.11C0 8.093 0 12 0 12s0 3.907.502 5.814a2.985 2.985 0 0 0 2.1 2.11C4.5 20.5 12 20.5 12 20.5s7.5 0 9.398-.576a2.985 2.985 0 0 0 2.1-2.11C24 15.907 24 12 24 12s0-3.907-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" },
  tiktok: { viewBox: "0 0 24 24", title: "TikTok", path: "M12.636 1c.448 3.832 2.576 5.96 6.364 6.364v3.155c-2.1.07-3.86-.62-5.364-1.727v6.636c0 3.28-2.327 5.572-5.636 5.572-3.1 0-5.636-2.48-5.636-5.572 0-3.124 2.567-5.636 5.727-5.636.248 0 .496.018.737.055v3.182a2.39 2.39 0 0 0-.737-.112c-1.33 0-2.418 1.08-2.418 2.511 0 1.428 1.08 2.5 2.418 2.5 1.47 0 2.455-.94 2.455-2.727V1h2.09z" },
};

interface WebsiteRow {
  id: string;
  name: string;
  url: string;
  emails: string[];
  socials: Record<string, string>;
  overall: number | null;
  performance: number | null;
  style: number | null;
  responsive: number | null;
  content: number | null;
  createdAt: string;
}

function scoreCell(v: number | null): React.ReactNode {
  if (v == null) return "—";
  return Math.round(v);
}

export default function WebsitesPage() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [websites, setWebsites] = useState<WebsiteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWebsites() {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/websites`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load websites");
        const list = data.websites ?? [];
        setWebsites(list);
        if (list.length === 0) {
          navigate("/analyze", { replace: true });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    fetchWebsites();
  }, [getToken, navigate]);

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    const token = await getToken();
    if (!token) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE}/websites`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      setWebsites((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  function handleRowClick(w: WebsiteRow) {
    navigate(`/analyze?url=${encodeURIComponent(w.url)}`);
  }

  if (loading) {
    return (
      <div className={styles.section}>
        <p>Loading your websites…</p>
      </div>
    );
  }

  if (error) {
    const isApiNotFound =
      error.includes("Not found") || error.includes("POST /analyze");
    return (
      <div className={styles.errorBanner}>
        {isApiNotFound
          ? "API may need to be rebuilt. Restart the API server and try again."
          : error}
      </div>
    );
  }

  if (websites.length === 0) {
    return (
      <div className={styles.section}>
        <p>Redirecting to Analyze…</p>
      </div>
    );
  }

  return (
    <div className={styles.result}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Your websites</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.adviceTable}>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">URL</th>
                <th scope="col">Emails</th>
                <th scope="col">Socials</th>
                <th scope="col">Overall</th>
                <th scope="col">Perf</th>
                <th scope="col">Style</th>
                <th scope="col">Resp</th>
                <th scope="col">Content</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              {websites.map((w) => (
                <tr
                  key={w.id}
                  onClick={() => handleRowClick(w)}
                  className={styles.websitesTableRow}
                >
                  <td>{w.name}</td>
                  <td>
                    <a
                      href={w.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.link}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {w.url}
                    </a>
                  </td>
                  <td>{w.emails.length ? w.emails.join(", ") : "—"}</td>
                  <td>
                    <div className={styles.socialIcons}>
                      {Object.entries(w.socials).map(([key, href]) => {
                        const icon = SOCIAL_ICONS[key.toLowerCase()];
                        const label = icon?.title ?? key;
                        return (
                          <a
                            key={key}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.socialIconCell}
                            title={label}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {icon ? (
                              <svg className={styles.socialIcon} viewBox={icon.viewBox} aria-hidden>
                                <path d={icon.path} />
                              </svg>
                            ) : (
                              key
                            )}
                          </a>
                        );
                      })}
                      {Object.keys(w.socials).length === 0 && "—"}
                    </div>
                  </td>
                  <td>{scoreCell(w.overall)}</td>
                  <td>{scoreCell(w.performance)}</td>
                  <td>{scoreCell(w.style)}</td>
                  <td>{scoreCell(w.responsive)}</td>
                  <td>{scoreCell(w.content)}</td>
                  <td>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnDelete}`}
                      onClick={(e) => handleDelete(e, w.id)}
                      disabled={deletingId === w.id}
                      aria-label={`Delete ${w.url}`}
                    >
                      {deletingId === w.id ? "…" : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
