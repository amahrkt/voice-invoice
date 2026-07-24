import Link from "next/link";
import VocaStrukLogo from "./VocaStrukLogo";

function Header() {
  return (
    <div>
      <header className="header">
        <nav>
          <div className="logo flex items-center gap-2 p-4">
            <Link href="/" className="flex items-center gap-3">
              {/* Logo aplikasi modern dengan ukuran 42px */}
              <VocaStrukLogo size={42} />
              {/* Nama aplikasi */}
              <span className="font-bold text-white text-xl tracking-wide">
                Voice-to-Invoice
              </span>
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