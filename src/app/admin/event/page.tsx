"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify";
import { Button } from "@/components/ui/button";
import { Amplify } from "aws-amplify";
import { useRouter } from "next/navigation"; // useRouterを追加
import outputs from "@/output";

Amplify.configure(outputs);

const client = generateClient<Schema>();

export default function EventList() {
  const [events, setEvents] = useState<Schema["Event"]["type"][]>([]);
  const router = useRouter(); // useRouterのインスタンスを作成

  // Eventデータの取得
  const fetchEvents = async () => {
    const { data: items, errors } = await client.models.Event.list();
    if (errors) {
      console.error("Error fetching events:", errors);
      return;
    }
    setEvents(items);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // 新しいEventの作成ボタンを押した際に /admin/add に遷移
  const navigateToAddEvent = () => {
    router.push("/admin/event/add");
  };

  // 編集ボタンが押された時に特定のイベント詳細ページへ遷移
  const handleEditEvent = (eventId: string | null | undefined) => {
    if (eventId) {
      router.push(`/admin/event/edit/${eventId}`);
    } else {
      console.error("Invalid eventId:", eventId);
    }
  };

  // 予約者一覧ボタンが押された時に特定のイベントの予約者一覧ページへ遷移
  const handleViewParticipants = (eventId: string | null | undefined) => {
    if (eventId) {
      router.push(`/admin/event/info/${eventId}`);
    } else {
      console.error("Invalid eventId:", eventId);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">イベント管理</h1>
        <Button onClick={navigateToAddEvent}>
          <PlusIcon className="h-4 w-4 mr-2" />
          イベントを追加
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {events.map((event) => (
          <div key={event.id} className="border p-4 rounded-lg shadow">
            <h2 className="text-lg font-bold">{event.title}</h2>
            <div className="text-sm">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                <span>{event.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <UsersIcon className="h-5 w-5 text-muted-foreground" />
                <span>
                  現在の参加者: {event.currentParticipants} /{" "}
                  {event.maxParticipants}
                </span>
              </div>
            </div>
            <div className="flex justify-between mt-4">
              <Button
                variant="outline"
                onClick={() => handleEditEvent(event.id)}
              >
                編集
              </Button>
              <Button
                variant="outline"
                onClick={() => handleViewParticipants(event.id)}
              >
                予約者一覧
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="1em" // サイズをテキストに合わせる
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
