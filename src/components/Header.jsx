import Link from "next/link";
import VocaStrukLogo from "./VocaStrukLogo";

function Header() {
  return (
    <div>
      <header className="header">
        <nav className="flex items-center justify-between w-full px-4">
          {/* Logo Container */}
          <div className="logo py-2">
            <Link href="/" className="flex flex-col items-center justify-center">
              {/* Logo dari sketsa tangan - Ukuran disesuaikan agar pas ditumpuk */}
              <VocaStrukLogo size={30} className="text-white" />
              
              {/* Teks Brand di bawah logo */}
              <span className="font-black text-white text-[10px] tracking-[0.2em] uppercase mt-1 leading-none">
                VocaStruk
              </span>
            </Link>
          </div>

          {/* Menu Links */}
          <div className="nav-links flex gap-6">
            <Link href="/" className="text-white hover:text-gray-300 transition-colors">Home</Link>
            <Link href="/about" className="text-white hover:text-gray-300 transition-colors">About</Link>
            <Link href="/settings" className="text-white hover:text-gray-300 transition-colors">Settings</Link>
          </div>
        </nav>
      </header>
    </div>
  );
}

export default Header;