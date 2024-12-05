"use client";
// Header.tsx
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";

export const Header: React.FC = () => {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleNavigation = (path: string, scrollToSection = false) => {
    router.push(path);
    if (scrollToSection) {
      setTimeout(() => {
        const target = document.getElementById("event-section");
        if (target) {
          target.scrollIntoView({ behavior: "smooth" });
        }
      }, 500);
    }
    setIsMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 flex justify-between items-center p-4 md:p-6 bg-black/70 backdrop-blur-sm z-50">
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
            onClick={() => handleNavigation("/home")}
          >
            過去イベント
          </a>
          <a
            href="#"
            className="text-white font-semibold py-2 md:py-0 hover:text-yellow-400 transition-colors duration-200"
            onClick={() => handleNavigation("/mypage/1")}
          >
            マイページ
          </a>
        </div>
      </div>
    </nav>
  );
};
