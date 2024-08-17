"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify";
import { Amplify } from "aws-amplify";
import outputs from "@/output";

Amplify.configure(outputs);

const client = generateClient<Schema>();

export default function Component() {
  const router = useRouter();
  const { id: reservationIdParam } = useParams();
  const reservationId = Array.isArray(reservationIdParam)
    ? reservationIdParam[0]
    : reservationIdParam;

  const [reservation, setReservation] = useState<
    Schema["Reservation"]["type"] | null
  >(null);
  const [event, setEvent] = useState<Schema["Event"]["type"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReservationAndEvent = async () => {
      if (!reservationId) {
        setError("Reservation ID が指定されていません。");
        setLoading(false);
        return;
      }

      try {
        const { data: reservationData, errors: reservationErrors } =
          await client.models.Reservation.get({
            id: reservationId,
          });

        if (reservationErrors || !reservationData) {
          setError("予約情報の取得に失敗しました。");
          setLoading(false);
          return;
        }

        setReservation(reservationData);

        if (reservationData.eventId) {
          const { data: eventData, errors: eventErrors } =
            await client.models.Event.get({
              id: reservationData.eventId,
            });

          if (eventErrors || !eventData) {
            setError("イベント情報の取得に失敗しました。");
            setLoading(false);
            return;
          }

          setEvent(eventData);
        }

        setLoading(false);
      } catch (fetchError) {
        setError("予約情報またはイベント情報の取得中にエラーが発生しました。");
        setLoading(false);
      }
    };

    fetchReservationAndEvent();
  }, [reservationId]);

  const handleReservation = () => {
    router.push("/home");
  };

  if (loading) {
    return <div>読み込み中...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!reservation) {
    return <div>予約情報が見つかりません。</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="p-4">
        <section className="text-center my-8">
          <h1 className="text-4xl font-bold mb-4">予約確認</h1>
          <p className="text-lg">以下の内容で予約が完了しました。</p>
        </section>
        <section className="max-w-2xl mx-auto bg-gray-100 p-6 rounded-md shadow-md">
          <h2 className="text-2xl font-semibold mb-4">予約内容</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="font-medium">予約番号:</span>
              <span>{reservation.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">イベント名:</span>
              <span>{event?.title ?? "不明なイベント"}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">会場:</span>
              <span>{event?.venue ?? "不明な会場"}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">日時:</span>
              <span>{reservation.reservationTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">参加費:</span>
              <span>{reservation.totalCost}円</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">参加人数:</span>
              <span>{reservation.participants}人</span>
            </div>
          </div>
        </section>
        <section className="max-w-2xl mx-auto bg-gray-100 p-6 rounded-md shadow-md mt-8">
          <h2 className="text-2xl font-semibold mb-4">予約者情報</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="font-medium">名前:</span>
              <span>{reservation.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">メールアドレス:</span>
              <span>{reservation.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">電話番号:</span>
              <span>{reservation.phone}</span>
            </div>
          </div>
        </section>
        <div className="flex justify-center mt-8">
          <Button type="button" variant="default" onClick={handleReservation}>
            ホームに戻る
          </Button>
        </div>
      </main>
    </div>
  );
}
