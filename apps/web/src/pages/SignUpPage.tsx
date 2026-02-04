import { SignUp } from "@clerk/clerk-react";
import styles from "../App.module.scss";

export default function SignUpPage() {
  return (
    <div className={styles.authPage}>
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/websites"
      />
    </div>
  );
}
