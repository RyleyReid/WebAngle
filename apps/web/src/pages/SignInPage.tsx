import { SignIn } from "@clerk/clerk-react";
import styles from "../App.module.scss";

export default function SignInPage() {
  return (
    <div className={styles.authPage}>
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/websites"
      />
    </div>
  );
}
