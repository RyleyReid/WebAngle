import { Outlet, Link, NavLink } from "react-router-dom";
import styles from "./App.module.scss";
import logo from "./assets/logo.png";

export default function Layout() {
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.headerLogoLink}>
            <img src={logo} alt="WebAngle" className={styles.headerLogo} />
          </Link>
          <nav className={styles.headerNav}>
            <NavLink to="/" end className={styles.headerNavLink}>
              Analyze
            </NavLink>
            <NavLink to="/how-it-works" className={styles.headerNavLink}>
              How it works
            </NavLink>
          </nav>
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
