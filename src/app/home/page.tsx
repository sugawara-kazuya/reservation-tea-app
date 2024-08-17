"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header/Header";
import { EventSection } from "@/components/home/EventSection";
import type { Schema } from "@/amplify";
import { generateClient } from "aws-amplify/data";
import { Amplify } from "aws-amplify";
import outputs from "@/output";

Amplify.configure(outputs);

const client = generateClient<Schema>();

export default function Page() {
  const [events, setEvents] = useState<Schema["Event"]["type"][]>([]);

  const fetchEvents = async () => {
    const { data: items, errors } = await client.models.Event.list();
    setEvents(items);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <div className="flex flex-col items-center w-full">
      <Header backgroundImage="https://reservation-tea-app.s3.ap-northeast-1.amazonaws.com/sample/homeback.jpg" />
      <main className="w-full max-w-5xl p-8">
        <h2 id="event-section" className="text-2xl font-bold text-center mb-8">
          お茶会のご案内
        </h2>
        <ul className="w-full max-w-5xl p-8">
          {events.map(
            ({
              id,
              title,
              venue,
              date,
              cost,
              description,
              imageUrl,
              maxParticipants,
              currentParticipants,
            }) => (
              <li key={id} className="mb-4 border-b pb-4">
                <EventSection
                  id={id ?? ""}
                  title={title ?? ""}
                  venue={venue ?? ""}
                  date={date ?? ""}
                  cost={cost ?? ""}
                  description={description ?? ""}
                  imageUrl={imageUrl ?? ""}
                  maxParticipants={maxParticipants ?? 0}
                  currentParticipants={currentParticipants ?? 0}
                />
              </li>
            )
          )}
        </ul>
        <section className="text-center">
          <h3 className="text-xl font-bold mb-2">代表 あいさつ</h3>
          <p>ぜひ茶道の楽しさに触れていただけると嬉しいです！！</p>
        </section>
      </main>
    </div>
  );
}
