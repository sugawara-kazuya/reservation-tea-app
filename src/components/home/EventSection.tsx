"use client";

// EventSection.tsx
import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface EventProps {
  title: string;
  venue: string;
  date: string;
  cost: string;
  description: string;
  imageUrl: string;
  id: number; // ID を追加
}

export const EventSection: React.FC<EventProps> = ({
  title,
  venue,
  date,
  cost,
  description,
  imageUrl,
  id, // ID を追加
}) => {
  const router = useRouter();

  const handleReservation = () => {
    router.push(`/home/${id}`);
  };

  return (
    <section className="mb-8">
      <div className="flex flex-col md:flex-row items-center mb-8">
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2">{title}</h3>
          <p className="mb-2">会場: {venue}</p>
          <p className="mb-2">日時: {date}</p>
          <p className="mb-2">参加費用: {cost}</p>
          <p className="mb-4">{description}</p>
          <button
            className="px-4 py-2 bg-yellow-500 text-white rounded-full"
            onClick={handleReservation}
          >
            予約する
          </button>
        </div>
        <div className="w-full md:w-1/3 h-auto mt-4 md:mt-0 md:ml-8">
          <Image
            src={imageUrl}
            alt="Event Image"
            width={500}
            height={300}
            layout="responsive"
            objectFit="cover"
          />
        </div>
      </div>
    </section>
  );
};
