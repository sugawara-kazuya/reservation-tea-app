"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { getCurrentUser } from 'aws-amplify/auth';
import { toast } from "react-hot-toast";

interface HeaderProps {
  backgroundImage?: string;
}

export const Header: React.FC<HeaderProps> = ({ backgroundImage }) => {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const { userId: currentUserId } = await getCurrentUser();
        setUserId(currentUserId);
      } catch (error) {
        console.error('Error fetching user ID:', error);
      }
    };

    fetchUserId();
  }, []);

  const handleNavigation = (path: string) => {
    if (path === "/mypage" && userId) {
      router.push(`/mypage/${userId}`);
    } else if (path === "/mypage") {
      router.push('/');
      toast.error('ログインが必要です');
    } else {
      router.push(path);
    }
    setIsMenuOpen(false);
  };

  return (
    <header className="relative">
      {backgroundImage && (
        <div 
          className="absolute inset-0 w-full h-[300px] bg-cover bg-center -z-10"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      )}
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
              onClick={() => handleNavigation("/home")}
            >
              ホーム
            </a>
            <a
              href="#"
              className="text-white font-semibold py-2 md:py-0 hover:text-yellow-400 transition-colors duration-200"
              onClick={() => handleNavigation("/history")}
            >
              過去イベント
            </a>
            <a
              href="#"
              className="text-white font-semibold py-2 md:py-0 hover:text-yellow-400 transition-colors duration-200"
              onClick={() => handleNavigation("/mypage")}
            >
              あなたのページ
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
};