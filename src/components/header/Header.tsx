"use client";
// Header.tsx
import React from "react";
import { useRouter } from "next/navigation";

interface HeaderProps {
  backgroundImage: string; // 背景画像を受け取るプロパティを追加
}

export const Header: React.FC<HeaderProps> = ({ backgroundImage }) => {
  const router = useRouter();

  const handleScroll = () => {
    const target = document.getElementById("event-section");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleNavigation = (path: string, scrollToSection = false) => {
    router.push(path);
    if (scrollToSection) {
      // 少し遅延させてスクロールする
      setTimeout(() => {
        handleScroll();
      }, 500); // 適度な遅延時間を設定
    }
  };

  return (
    <header
      className="relative w-full h-[500px] bg-cover bg-center"
      style={{
        backgroundImage: `url('${backgroundImage}')`,
      }}
    >
      <div className="absolute inset-0 bg-black/50" />
      <nav className="absolute top-0 left-0 right-0 flex justify-end p-6 space-x-8 text-white">
        <a
          href="#"
          className="font-semibold"
          onClick={() => handleNavigation("/home", true)}
        >
          ホーム
        </a>
        <a
          href="#"
          className="font-semibold"
          onClick={() => handleNavigation("/reservation")}
        >
          予約確認
        </a>
        <a
          href="#"
          className="font-semibold"
          onClick={() => handleNavigation("/history")}
        >
          過去イベント
        </a>
      </nav>
      <div className="absolute bottom-16 left-16 text-white">
        <h1 className="text-4xl font-bold">WELCOME TO</h1>
        <h2 className="text-6xl font-bold">sekishu</h2>
        <p className="mt-4">石州流野村派のお茶席予約サイト</p>
        <a
          href="#"
          className="mt-8 px-6 py-3 bg-yellow-500 text-white rounded-full inline-block"
          onClick={() => handleNavigation("/home", true)} // ホームページに移動してからスクロール
        >
          直近のお茶会
        </a>
      </div>
    </header>
  );
};
