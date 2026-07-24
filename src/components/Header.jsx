import Link from "next/link";
// 1. Hapus impor Store dari lucide-react dan ganti dengan logo buatan kita
import VocaStrukLogo from "./VocaStrukLogo";

function Header() {
  return (
    <div>
      <header className="header">
        <nav>
          <div className="logo flex items-center gap-2 p-4">
            <Link href="/">
              {/* 2. Gunakan VocaStrukLogo dengan ukuran 32px (setara w-8 h-8) dan warna putih */}
              <VocaStrukLogo size={52} className="text-white" />
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