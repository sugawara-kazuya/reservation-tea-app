"use client";
// Header.tsx
import React from "react";

interface HeaderProps {
  backgroundImage: string; // 背景画像を受け取るプロパティを追加
}

export const Header: React.FC<HeaderProps> = ({ backgroundImage }) => {
  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault();
    const target = document.getElementById("event-section");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
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
        <a href="/home" className="font-semibold">
          ホーム
        </a>
        <a href="/info" className="font-semibold">
          予約確認
        </a>
        <a href="#" className="font-semibold">
          お問い合わせ
        </a>
      </nav>
      <div className="absolute bottom-16 left-16 text-white">
        <h1 className="text-4xl font-bold">WELCOME TO</h1>
        <h2 className="text-6xl font-bold">sekishu</h2>
        <p className="mt-4">石州流野村派のお茶席予約サイト</p>
        <a
          href="/home#event-section"
          className="mt-8 px-6 py-3 bg-yellow-500 text-white rounded-full inline-block"
          onClick={handleScroll} // クリックイベントハンドラを追加
        >
          直近のお茶会
        </a>
      </div>
    </header>
  );
};
