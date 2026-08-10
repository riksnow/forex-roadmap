import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import AuthButtons from "./AuthButtons";

export default async function Header() {
  const session = await getServerSession(authOptions);

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="brand">
          <span className="brand-dot" aria-hidden="true"></span>
          Forex Roadmap
        </Link>
        <nav className="site-nav">
          <Link href="/">Roadmap</Link>
          <Link href="/tools">Pro Tools</Link>
          <Link href="/settings">Settings</Link>
        </nav>
        <AuthButtons session={session} />
      </div>
    </header>
  );
}
