"use client";
// Header.tsx
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";

interface HeaderProps {
  backgroundImage: string;
}

export const Header: React.FC<HeaderProps> = ({ backgroundImage }) => {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleScroll = () => {
    const target = document.getElementById("event-section");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleNavigation = (path: string, scrollToSection = false) => {
    router.push(path);
    if (scrollToSection) {
      setTimeout(() => {
        handleScroll();
      }, 500);
    }
    setIsMenuOpen(false);
  };

  return (
    <header
      className="relative w-full h-[500px] md:h-[600px] bg-cover bg-center"
      style={{
        backgroundImage: `url('${backgroundImage}')`,
      }}
    >
      <div className="absolute inset-0 bg-black/50" />
      <nav className="absolute top-0 left-0 right-0 flex justify-between items-center p-4 md:p-6 bg-black/70 backdrop-blur-sm">
        <div className="text-white text-xl font-bold">sekishu</div>
        <div className="md:hidden">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-white focus:outline-none"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        <div
          className={`${
            isMenuOpen ? "flex" : "hidden"
          } md:flex flex-col md:flex-row absolute md:relative top-full left-0 right-0 md:top-auto bg-black/90 md:bg-transparent backdrop-blur-md md:backdrop-blur-none transition-all duration-300 ease-in-out`}
        >
          <div className="flex flex-col md:flex-row md:space-x-8 p-4 md:p-0">
            <a
              href="#"
              className="text-white font-semibold py-2 md:py-0 hover:text-yellow-400 transition-colors duration-200"
              onClick={() => handleNavigation("/home", true)}
            >
              ホーム
            </a>
            <a
              href="#"
              className="text-white font-semibold py-2 md:py-0 hover:text-yellow-400 transition-colors duration-200"
              onClick={() => handleNavigation("/reservation")}
            >
              予約確認（キャンセル）
            </a>
            <a
              href="#"
              className="text-white font-semibold py-2 md:py-0 hover:text-yellow-400 transition-colors duration-200"
              onClick={() => handleNavigation("/history")}
            >
              過去イベント
            </a>
          </div>
        </div>
      </nav>
      <div className="absolute bottom-16 left-4 md:left-16 text-white">
        <h1 className="text-3xl md:text-4xl font-bold">WELCOME TO</h1>
        <h2 className="text-5xl md:text-6xl font-bold">sekishu</h2>
        <p className="mt-4 text-sm md:text-base">
          石州流野村派のお茶席予約サイト
        </p>
        <a
          href="#"
          className="mt-6 md:mt-8 px-4 md:px-6 py-2 md:py-3 bg-yellow-500 text-white text-sm md:text-base rounded-full inline-block hover:bg-yellow-600 transition-colors duration-200"
          onClick={() => handleNavigation("/home", true)}
        >
          直近のお茶会
        </a>
      </div>
    </header>
  );
};
