"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header/Header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify";
import { Amplify } from "aws-amplify";
import outputs from "@/output";

Amplify.configure(outputs);

const client = generateClient<Schema>();

export default function Component() {
  const router = useRouter();
  const [reservationId, setReservationId] = useState("");
  const [reservation, setReservation] = useState<
    Schema["Reservation"]["type"] | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<Schema["Event"]["type"][]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isValidInput, setIsValidInput] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data: eventData, errors } = await client.models.Event.list({
        filter: {
          isActive: {
            eq: true,
          },
        },
      });
      if (errors) {
        console.error("イベントの取得中にエラーが発生しました:", errors);
        return;
      }
      setEvents(eventData);
    } catch (error) {
      console.error("イベントの取得中にエラーが発生しました:", error);
    }
  };

  useEffect(() => {
    // 入力が有効かどうかをチェック
    setIsValidInput(selectedEventId !== null && reservationId.length === 6);
  }, [selectedEventId, reservationId]);

  const handleReservationCheck = async () => {
    if (!isValidInput) {
      setError("イベントを選択し、6桁の予約番号を入力してください。");
      return;
    }

    try {
      const { data: eventData, errors: eventErrors } =
        await client.models.Event.get({
          id: selectedEventId ?? "",
        });

      if (eventErrors || !eventData || !eventData.isActive) {
        setError("選択されたイベントは無効です。");
        return;
      }

      const { data: reservationData, errors } =
        await client.models.Reservation.list({
          filter: {
            reservationNumber: { eq: reservationId },
            eventId: { eq: selectedEventId ?? "" },
          },
        });

      if (errors || !reservationData || reservationData.length === 0) {
        setError("予約情報が見つかりません。");
        return;
      }

      setReservation(reservationData[0]);
      router.push(`/home/reservation/${reservationData[0].id}`);
    } catch (fetchError) {
      setError("予約情報の取得に失敗しました。");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header backgroundImage="https://reservation-tea-app.s3.ap-northeast-1.amazonaws.com/sample/homeback4.jpg" />
      <main className="flex flex-col items-center w-full flex-1 p-6 bg-white">
        <div className="max-w-2xl w-full space-y-8">
          <h2 className="text-3xl font-bold text-center">予約確認</h2>
          <p className="text-center text-gray-700">
            予約の確認するには、以下の情報を入力してください。
          </p>
          {error && <div className="text-red-500 text-center">{error}</div>}
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleReservationCheck();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="event-select">イベント</Label>
              <Select onValueChange={(value) => setSelectedEventId(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="イベントを選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event.id ?? ""} value={event.id ?? ""}>
                      {event.title ?? "無題のイベント"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reservation-id">予約番号</Label>
              <Input
                id="reservation-id"
                placeholder="6桁の予約番号を入力してください"
                value={reservationId}
                onChange={(e) => setReservationId(e.target.value)}
                maxLength={6}
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleReservationCheck}
                disabled={!isValidInput}
              >
                予約確認
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
