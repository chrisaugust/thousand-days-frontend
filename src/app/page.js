import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";
import shapes from "./ui/home.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>1000 Day Commitment</h1>
        <h2>Go Slow to Go Fast</h2>

        <div>
          <Link
            href="/login"
            className={styles.button}
            >
            <span>Log in</span>
          </Link>
          <Link
            href="/signup"
            className={styles.button}
            >
              <span>Sign Up</span>
          </Link>
        </div>
        <Image
          src="/sloth-posterized.png"
          width={1024}
          height={1024}
          className={shapes.hero}
          alt="Sloth: go slow to go fast"
        />

      </main>
    </div>
  );
}
