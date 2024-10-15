"use client";

import { useState, useEffect } from "react";
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
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { fetchAuthSession } from "aws-amplify/auth";

Amplify.configure(outputs);

const client = generateClient<Schema>();

async function sendCancellationEmail(
  toEmail: string,
  reservationDetails: {
    name: string;
    eventTitle: string;
    date: string;
    time: string;
  }
) {
  const { credentials } = await fetchAuthSession();
  const sesClient = new SESClient({
    credentials: credentials,
    region: "ap-northeast-1",
  });

  const params = {
    Destination: {
      ToAddresses: [toEmail],
    },
    Message: {
      Body: {
        Text: {
          Charset: "UTF-8",
          Data: `
${reservationDetails.name} 様

お茶会の予約キャンセルが完了しました。

キャンセルされた予約詳細:
イベント名: ${reservationDetails.eventTitle}
日付: ${reservationDetails.date}
時間: ${reservationDetails.time}

またのご利用をお待ちしております。

ご不明な点がございましたら、お気軽にお問い合わせください。
          `,
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: `【予約キャンセル完了】${reservationDetails.eventTitle}のお知らせ`,
      },
    },
    Source: "kz515yssg@gmail.com ", // SESで検証済みのメールアドレスを設定してください
  };

  try {
    const command = new SendEmailCommand(params);
    const response = await sesClient.send(command);
    console.log("Email sent successfully:", response.MessageId);
    return response.MessageId;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

export default function Component() {
  const router = useRouter();
  const [reservationId, setReservationId] = useState("");
  const [reservation, setReservation] = useState<
    Schema["Reservation"]["type"] | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
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

  const handleReservationCancel = async () => {
    if (!isValidInput) {
      setError("イベントを選択し、6桁の予約番号を入力してください。");
      return;
    }

    try {
      const { data: eventDataForCancel, errors: eventErrorsForCancel } =
        await client.models.Event.get({
          id: selectedEventId ?? "",
        });

      if (
        eventErrorsForCancel ||
        !eventDataForCancel ||
        !eventDataForCancel.isActive
      ) {
        setError("選択されたイベントは無効です。");
        return;
      }

      const { data: reservationData, errors: reservationErrors } =
        await client.models.Reservation.list({
          filter: {
            reservationNumber: { eq: reservationId },
            eventId: { eq: selectedEventId ?? "" },
          },
        });

      if (
        reservationErrors ||
        !reservationData ||
        reservationData.length === 0
      ) {
        setError("予約情報が見つかりません。");
        return;
      }

      const reservation = reservationData[0];
      const participants = reservation.participants ?? 0;
      const eventId = reservation.eventId;

      if (!eventId) {
        setError("イベントIDが見つかりません。");
        return;
      }

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

      const { data: timeSlotsData, errors: timeSlotsErrors } =
        await client.models.EventTimeSlot.list({
          filter: {
            eventId: {
              eq: eventId,
            },
          },
        });

      if (timeSlotsErrors || !timeSlotsData) {
        setError("時間スロット情報の取得に失敗しました。");
        return;
      }

      const matchingSlot = timeSlotsData.find(
        (slot) => slot.timeSlot === reservation.reservationTime
      );
      if (matchingSlot) {
        const updatedTimeSlot = {
          ...matchingSlot,
          currentParticipants:
            (matchingSlot.currentParticipants ?? 0) - participants,
        };

        await client.models.EventTimeSlot.update(updatedTimeSlot);
      }

      await client.models.Reservation.delete({
        id: reservation.id,
      });

      if (reservation.email) {
        await sendCancellationEmail(reservation.email, {
          name: reservation.name ?? "ゲスト",
          eventTitle: eventDataForCancel.title ?? "不明なイベント",
          date: eventDataForCancel.date ?? "不明な日付",
          time: reservation.reservationTime ?? "不明な時間",
        });
      } else {
        console.error(
          "予約にメールアドレスが登録されていません:",
          reservationId
        );
      }

      setReservation(null);
      setShowConfirmation(true);
    } catch (cancelError) {
      console.error("予約のキャンセルに失敗しました:", cancelError);
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
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                onClick={handleReservationCheck}
                disabled={!isValidInput}
              >
                予約確認
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    className="bg-red-500 text-white hover:bg-red-600 rounded-md px-4 py-2 font-medium"
                    disabled={!isValidInput}
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
