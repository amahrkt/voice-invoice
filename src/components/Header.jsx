import Link from "next/link";
import { Store } from "lucide-react";

function Header() {
  return (
    <div>
      <header className="header">
        <nav>
          <div className="logo flex items-center gap-2 p-4">
            <Link href="/">
              <Store className="w-8 h-8 text-white" />
            </Link>
          </div>
          <div className="nav-links">
            <Link href="/">Home</Link>
            <Link href="/about">About</Link>
            <Link href="/settings">Settings</Link>
          </div>
        </nav>
      </header>
    </div>
  );
}

export default Header;
