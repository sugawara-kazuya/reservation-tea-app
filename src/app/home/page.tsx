"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header/Header";
import { EventSection } from "@/components/home/EventSection";
import type { Schema } from "@/amplify";
import { generateClient } from "aws-amplify/data";
import { Amplify } from "aws-amplify";
import outputs from "@/output";
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

import { translations } from "@aws-amplify/ui-react";
import { I18n } from "aws-amplify/utils";
const customTranslations = {
  ja: {
    "Code *": "認証コード",
    "Password must have at least 8 characters":
      "パスワードは8文字以上必要です",
    "Your passwords must match": "パスワードが一致しません",
  }
}
I18n.putVocabularies(translations);
I18n.putVocabularies(customTranslations);
I18n.setLanguage("ja");

Amplify.configure(outputs);

const client = generateClient<Schema>();

export default function Page() {
  const [events, setEvents] = useState<Schema["Event"]["type"][]>([]);
  const [isMobile, setIsMobile] = useState(false);

  const fetchEvents = async () => {
    const { data: items, errors } = await client.models.Event.list({
      filter: { isActive: { eq: true } },
    });
    if (errors) {
      console.error("Error fetching events:", errors);
      return;
    }
    setEvents(items);
  };

  useEffect(() => {
    fetchEvents();
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleNavigation = (path: string, replace: boolean) => {
    if (replace) {
      window.location.replace(path);
    } else {
      window.location.href = path;
    }
  };

  return (
    <Authenticator>
      <div className="flex flex-col items-center w-full">
        <div
          className="relative w-full h-[500px] md:h-[600px] bg-cover bg-center"
          style={{
            backgroundImage: "url('https://reservation-tea-app.s3.ap-northeast-1.amazonaws.com/sample/homeback.jpg')",
          }}
        >
          <div className="absolute inset-0 bg-black/50" />
          <Header />
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
        </div>
        <main className="w-full max-w-5xl p-8">
          <h2 id="event-section" className="text-2xl font-bold text-center mb-8">
            お茶会のご案内
          </h2>
          <ul className="w-full px-4 sm:px-0">
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
                    isMobile={isMobile}
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
    </Authenticator>
  );
}
