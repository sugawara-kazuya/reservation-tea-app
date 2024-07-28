// Component.tsx
import React from "react";
import { Header } from "@/components/header/Header";
import { EventSection } from "@/components/home/EventSection";
import { events } from "@/components/sampleData/home/sampleData";

const Component: React.FC = () => {
  return (
    <div className="flex flex-col items-center w-full">
      <Header />
      <main className="w-full max-w-5xl p-8">
        <h2 className="text-2xl font-bold text-center mb-8">お茶会のご案内</h2>
        {events.map((event, index) => (
          <EventSection
            key={index}
            id={event.id} // ID を渡す
            title={event.title}
            venue={event.venue}
            date={event.date}
            cost={event.cost}
            description={event.description}
            imageUrl={event.imageUrl}
          />
        ))}
        <section className="text-center">
          <h3 className="text-xl font-bold mb-2">代表 堀政春</h3>
          <p>ぜひ茶道の楽しさに触れていただけると嬉しいです！！</p>
        </section>
      </main>
    </div>
  );
};

export default Component;
