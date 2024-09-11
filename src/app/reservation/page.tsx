"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header/Header";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleReservationCheck = async () => {
    if (!reservationId) {
      setError("予約IDを入力してください。");
      return;
    }

    try {
      const { data: reservationData, errors } =
        await client.models.Reservation.get({
          id: reservationId,
        });

      if (errors || !reservationData) {
        setError("予約情報が見つかりません。");
        return;
      }

      setReservation(reservationData);
      router.push(`/home/reservation/${reservationData.id}`);
    } catch (fetchError) {
      setError("予約情報の取得に失敗しました。");
    }
  };

  const handleReservationCancel = async () => {
    if (!reservationId) {
      setError("予約IDを入力してください。");
      return;
    }

    try {
      // 予約情報の取得
      const { data: reservationData, errors: reservationErrors } =
        await client.models.Reservation.get({
          id: reservationId,
        });

      if (reservationErrors || !reservationData) {
        setError("予約情報が見つかりません。");
        return;
      }

      // participantsがnullの場合は0をデフォルト値として設定
      const participants = reservationData.participants ?? 0;

      // Event IDがnullでないことを確認
      const eventId = reservationData.eventId;
      if (!eventId) {
        setError("イベントIDが見つかりません。");
        return;
      }

      // Eventの人数を更新
      const { data: eventData, errors: eventErrors } =
        await client.models.Event.get({
          id: eventId,
        });

      if (eventErrors || !eventData) {
        setError("イベント情報の取得に失敗しました。");
        return;
      }

      const updatedEvent = {
        ...eventData,
        currentParticipants:
          (eventData.currentParticipants ?? 0) - participants,
      };

      await client.models.Event.update(updatedEvent);

      // EventTimeSlotのデータを取得して人数を減算
      const { data: timeSlotsData, errors: timeSlotsErrors } =
        await client.models.EventTimeSlot.list({
          filter: {
            eventId: {
              eq: eventId, // eventIdがstring型として使用される
            },
          },
        });

      if (timeSlotsErrors || !timeSlotsData) {
        setError("時間スロット情報の取得に失敗しました。");
        return;
      }

      // 単に最初のスロットを選んで更新する例
      if (timeSlotsData.length > 0) {
        const updatedTimeSlot = {
          ...timeSlotsData[0],
          currentParticipants:
            (timeSlotsData[0].currentParticipants ?? 0) - participants,
        };

        await client.models.EventTimeSlot.update(updatedTimeSlot);
      }

      // 予約の削除
      await client.models.Reservation.delete({
        id: reservationId,
      });

      setReservation(null);
      setShowConfirmation(true);
    } catch (cancelError) {
      setError("予約のキャンセルに失敗しました。");
    }
  };

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
    router.push("/home");
  };

  return (
    <div className="min-h-screen bg-white">
      <Header backgroundImage="https://reservation-tea-app.s3.ap-northeast-1.amazonaws.com/sample/homeback4.jpg" />
      <main className="flex flex-col items-center w-full flex-1 p-6 bg-white">
        <div className="max-w-2xl w-full space-y-8">
          <h2 className="text-3xl font-bold text-center">予約確認</h2>
          <p className="text-center text-gray-700">
            予約の確認・キャンセルするには、以下の情報を入力してください。
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
              <Label htmlFor="reservation-id">予約ID</Label>
              <Input
                id="reservation-id"
                placeholder="予約IDを入力してください"
                value={reservationId}
                onChange={(e) => setReservationId(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-4">
              <Button type="button" onClick={handleReservationCheck}>
                予約確認
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    className="bg-red-500 text-white hover:bg-red-600 rounded-md px-4 py-2 font-medium"
                  >
                    予約キャンセル
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>本当によろしいですか?</DialogTitle>
                    <DialogDescription>
                      この操作は元に戻すことはできません。選択した予約が完全に削除されます。
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline">いいえ</Button>
                    <Button
                      variant="destructive"
                      onClick={handleReservationCancel}
                    >
                      削除する
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </form>
        </div>
      </main>
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>予約キャンセル完了</DialogTitle>
            <DialogDescription>
              予約のキャンセルが完了しました。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleCloseConfirmation}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}