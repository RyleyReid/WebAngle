import { Link } from "react-router-dom";
import styles from "./HowItWorks.module.scss";

export default function HowItWorks() {
  return (
    <article className={styles.page}>
      <h1 className={styles.title}>How WebAngle works</h1>
      <p className={styles.lead}>
        WebAngle is a developer-first outreach intelligence tool. Paste a
        website URL and get a fast, opinionated teardown built for freelancers,
        agencies, and consultants who pitch website upgrades.
      </p>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>What you get</h2>
        <p>
          One analysis gives you structured intelligence you can use immediately:
        </p>
        <ul className={styles.list}>
          <li>
            <strong>Contact data</strong> — Emails, phone numbers, and social
            links we find on the site so you know who to reach.
          </li>
          <li>
            <strong>Tech stack</strong> — Detected platform (WordPress,
            Webflow, Shopify, Wix, React, etc.) so you can speak to their stack.
          </li>
          <li>
            <strong>Performance signals</strong> — Mobile score, load time, and
            core metrics so you can point to real issues.
          </li>
          <li>
            <strong>Upgrade opportunities</strong> — A short list of
            high-confidence issues: what’s weak, why it matters to the
            business, and how to fix it.
          </li>
          <li>
            <strong>Pitch angles</strong> — Ready-to-use lines you can drop into
            cold emails or DMs so your outreach is specific, not generic.
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Why it’s useful</h2>
        <p>
          Generic outreach gets ignored. WebAngle focuses on{" "}
          <strong>actionable pitch angles</strong>: real weaknesses, clear
          business impact, and credible fixes. You get a teardown in under 10
          seconds, then copy a pitch angle straight into your next cold email.
          No dashboards, no accounts — just paste a URL and use the output.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>How we do it</h2>
        <p>
          We fetch the site, extract contact and content signals, run a
          performance check, and send one AI call to turn that context into
          upgrade opportunities and pitch angles. Results are cached so
          re-analyzing the same URL is instant.
        </p>
      </section>

      <p className={styles.cta}>
        <Link to="/" className={styles.ctaLink}>
          Analyze a website →
        </Link>
      </p>
    </article>
  );
}
