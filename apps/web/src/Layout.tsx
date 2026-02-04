import { Outlet, Link, NavLink } from "react-router-dom";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import styles from "./App.module.scss";
import logo from "./assets/logo.png";

function SignedInNav() {
  return (
    <>
      <NavLink to="/websites" className={styles.headerNavLink}>
        Websites
      </NavLink>
      <NavLink to="/analyze" className={styles.headerNavLink}>
        Analyze
      </NavLink>
    </>
  );
}

export default function Layout() {
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.headerLogoLink}>
            <img src={logo} alt="WebAngle" className={styles.headerLogo} />
          </Link>
          <nav className={styles.headerNav}>
            <SignedIn>
              <SignedInNav />
            </SignedIn>
            <NavLink to="/how-it-works" className={styles.headerNavLink}>
              How it works
            </NavLink>
            <SignedOut>
              <SignInButton mode="modal">
                <button className={`${styles.btn} ${styles.btnPrimary}`} type="button">
                  Sign in
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </nav>
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
