// Header.tsx
import React from "react";

export const Header: React.FC = () => {
  return (
    <header
      className="relative w-full h-[500px] bg-cover bg-center"
      style={{
        backgroundImage:
          "url('https://reservation-tea-app.s3.ap-northeast-1.amazonaws.com/sample/homeback.jpg')",
      }}
    >
      <div className="absolute inset-0 bg-black/50" />
      <nav className="absolute top-0 left-0 right-0 flex justify-end p-6 space-x-8 text-white">
        <a href="#" className="font-semibold">
          ホーム
        </a>
        <a href="#" className="font-semibold">
          茶道とは
        </a>
        <a href="#" className="font-semibold">
          初めてのお茶席
        </a>
        <a href="#" className="font-semibold">
          お問い合わせ
        </a>
      </nav>
      <div className="absolute bottom-16 left-16 text-white">
        <h1 className="text-4xl font-bold">WELCOME TO</h1>
        <h2 className="text-6xl font-bold">sekishu</h2>
        <p className="mt-4">石州流野村派のお茶席予約サイト</p>
        <button className="mt-8 px-6 py-3 bg-yellow-500 text-white rounded-full">
          直近のお茶会
        </button>
      </div>
    </header>
  );
};
