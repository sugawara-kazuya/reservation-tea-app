"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface EventProps {
  id: string | undefined;
  title: string | undefined;
  venue: string | undefined;
  date: string | undefined;
  cost: string | number | undefined;
  description: string | undefined;
  imageUrl: string;
  maxParticipants: number | undefined; // 新しく追加
  currentParticipants: number | undefined; // 新しく追加
  isMobile: boolean;
}

export const EventSection: React.FC<EventProps> = ({
  id,
  title,
  venue,
  date,
  cost,
  description,
  imageUrl,
  maxParticipants,
  currentParticipants,
  isMobile,
}) => {
  const router = useRouter();

  const handleReservation = () => {
    if (id) {
      router.push(`/home/${id}`);
    }
  };

  return (
    <section className="mb-8">
      <div className="flex flex-col md:flex-row items-start mb-8">
        <div className="w-full md:w-1/3 h-auto order-1 md:order-2 mb-4 md:mb-0 md:ml-8">
          <Image
            src={imageUrl}
            alt="Event Image"
            width={500}
            height={300}
            layout="responsive"
            objectFit="cover"
          />
        </div>
        <div className="flex-1 order-2 md:order-1 text-left">
          <h3 className="text-xl font-bold mb-2">{title}</h3>
          <p className="mb-2">会場: {venue}</p>
          <p className="mb-2">日時: {date}</p>
          <p className="mb-2">参加費用: {cost}円</p>
          <p className="mb-2">
            参加人数: {currentParticipants}/{maxParticipants} 人
          </p>
          <p className="mb-4">{description}</p>
          <button
            className="px-4 py-2 bg-yellow-500 text-white rounded-full"
            onClick={handleReservation}
          >
            予約する
          </button>
        </div>
      </div>
    </section>
  );
};
