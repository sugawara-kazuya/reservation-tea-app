// app/confirmation/[id]/page.tsx

"use client";

import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify";
import { Amplify } from "aws-amplify";
import outputs from "@/output";
import {
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  CreditCardIcon,
  UserIcon,
  MailIcon,
  PhoneIcon,
  TrashIcon,
  CheckCircleIcon,
} from "lucide-react";

Amplify.configure(outputs);

const client = generateClient<Schema>();

function Alert({
  message,
  type,
}: {
  message: string;
  type: "error" | "success";
}) {
  return (
    <div
      className={`fixed top-4 right-4 p-4 rounded-md ${
        type === "error" ? "bg-red-500" : "bg-green-500"
      } text-white shadow-lg transition-all duration-300 ease-in-out`}
    >
      {type === "success" ? (
        <CheckCircleIcon className="inline-block mr-2" size={20} />
      ) : (
        <TrashIcon className="inline-block mr-2" size={20} />
      )}
      {message}
    </div>
  );
}

export default function ConfirmationPage() {
  const router = useRouter();
  const { id: reservationIdParam } = useParams();
  const reservationId = Array.isArray(reservationIdParam)
    ? reservationIdParam[0]
    : reservationIdParam;

  // クエリパラメータを取得
  const searchParams = useSearchParams();
  const fromHome = searchParams.get("from") === "home";

  const [reservation, setReservation] = useState<
    Schema["Reservation"]["type"] | null
  >(null);
  const [event, setEvent] = useState<Schema["Event"]["type"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [alert, setAlert] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);

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

  const handleDeleteReservation = async () => {
    setIsDeleteModalOpen(false);
    if (!reservation || !event) {
      setAlert({
        message: "予約情報またはイベント情報が不足しています",
        type: "error",
      });
      return;
    }

    if (!event.id || !reservation.reservationTime) {
      setAlert({
        message: "イベントIDまたは予約時間が不足しています",
        type: "error",
      });
      return;
    }

    try {
      const { errors: deleteErrors } = await client.models.Reservation.delete({
        id: reservation.id,
      });

      if (deleteErrors) {
        throw new Error("予約の削除に失敗しました");
      }

      const updatedEvent = {
        id: event.id,
        currentParticipants: Math.max(
          0,
          (event.currentParticipants ?? 0) - (reservation.participants ?? 0)
        ),
      };
      const { errors: eventUpdateErrors } =
        await client.models.Event.update(updatedEvent);

      if (eventUpdateErrors) {
        throw new Error("イベント情報の更新に失敗しました");
      }

      const { data: allTimeSlots, errors: timeSlotErrors } =
        await client.models.EventTimeSlot.list({
          filter: { eventId: { eq: event.id } },
        });

      if (timeSlotErrors) {
        throw new Error("時間枠情報の取得に失敗しました");
      }

      const reservationDateTime = new Date(
        reservation.reservationTime || Date.now()
      );
      let closestTimeSlot = allTimeSlots.reduce((closest, current) => {
        const currentDateTime = new Date(current.timeSlot || Date.now());
        const closestDateTime = new Date(closest.timeSlot || Date.now());

        return Math.abs(
          currentDateTime.getTime() - reservationDateTime.getTime()
        ) < Math.abs(closestDateTime.getTime() - reservationDateTime.getTime())
          ? current
          : closest;
      });

      if (!closestTimeSlot) {
        throw new Error("該当する時間枠が見つかりません");
      }

      const updatedTimeSlot = {
        id: closestTimeSlot.id,
        currentParticipants: Math.max(
          0,
          (closestTimeSlot.currentParticipants ?? 0) -
            (reservation.participants ?? 0)
        ),
      };
      const { errors: timeSlotUpdateErrors } =
        await client.models.EventTimeSlot.update(updatedTimeSlot);

      if (timeSlotUpdateErrors) {
        throw new Error("時間枠情報の更新に失敗しました");
      }

      setAlert({ message: "予約が正常に削除されました", type: "success" });
      setTimeout(() => {
        router.push("/home");
      }, 2000);
    } catch (error) {
      console.error("予約の削除中にエラーが発生しました:", error);
      setAlert({
        message: "予約の削除中にエラーが発生しました。もう一度お試しください。",
        type: "error",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-gray-800">
              予約確認
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-red-600">
              エラー
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-700">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-gray-800">
              予約情報が見つかりません
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const accompaniedGuests = [
    reservation.accompaniedGuest1,
    reservation.accompaniedGuest2,
    reservation.accompaniedGuest3,
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      {alert && <Alert message={alert.message} type={alert.type} />}
      <main className="max-w-4xl mx-auto">
        <Card className="mb-8 shadow-lg">
          <CardHeader className="text-center bg-primary text-primary-foreground rounded-t-lg">
            <CardTitle className="text-3xl font-extrabold">予約確認</CardTitle>
            <p className="mt-2 text-lg">以下の内容で予約が完了しました！</p>
            <p className="mt-2 text-lg">
              なお、予約完了メールはシステムの都合上、遅れて届く場合がございます。
            </p>
          </CardHeader>
        </Card>

        <div className="space-y-8">
          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="bg-secondary text-secondary-foreground">
              <CardTitle className="text-xl font-semibold">予約内容</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2 p-6">
              <InfoItem
                icon={<CalendarIcon />}
                label="予約番号"
                value={reservation.id}
              />
              <InfoItem
                icon={<CalendarIcon />}
                label="イベント名"
                value={event?.title}
              />
              <InfoItem
                icon={<MapPinIcon />}
                label="会場"
                value={event?.venue}
              />
              <InfoItem
                icon={<CalendarIcon />}
                label="日時"
                value={reservation.reservationTime}
              />
              <InfoItem
                icon={<CreditCardIcon />}
                label="参加費"
                value={
                  reservation.totalCost
                    ? `${reservation.totalCost}円`
                    : undefined
                }
              />
              <InfoItem
                icon={<UsersIcon />}
                label="参加人数"
                value={
                  reservation.participants
                    ? `${reservation.participants}人`
                    : undefined
                }
              />
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="bg-secondary text-secondary-foreground">
              <CardTitle className="text-xl font-semibold">
                予約者情報
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2 p-6">
              <InfoItem
                icon={<UserIcon />}
                label="名前"
                value={reservation.name}
              />
              <InfoItem
                icon={<MailIcon />}
                label="メールアドレス"
                value={reservation.email}
              />
              <InfoItem
                icon={<PhoneIcon />}
                label="電話番号"
                value={reservation.phone}
              />
            </CardContent>
          </Card>

          {accompaniedGuests.length > 0 && (
            <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="bg-secondary text-secondary-foreground">
                <CardTitle className="text-xl font-semibold">
                  同行者情報
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 p-6">
                {accompaniedGuests.map((guest, index) => (
                  <InfoItem
                    key={index}
                    icon={<UserIcon />}
                    label={`同行者 ${index + 1}`}
                    value={guest}
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="mt-12 flex justify-center space-x-4">
          <Button
            type="button"
            variant="default"
            onClick={handleReservation}
            className="px-8 py-3 text-lg shadow-md hover:shadow-lg transition-shadow duration-300"
          >
            ホームに戻る
          </Button>
          {/* fromHome が false の場合のみ削除ボタンを表示 */}
          {!fromHome && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-8 py-3 text-lg shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <TrashIcon className="w-5 h-5 mr-2" />
              予約を削除
            </Button>
          )}
        </div>

        <AlertDialog
          open={isDeleteModalOpen}
          onOpenChange={setIsDeleteModalOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>予約を削除しますか？</AlertDialogTitle>
              <AlertDialogDescription>
                この操作は取り消せません。予約を削除すると、すべての関連情報が削除されます。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteReservation}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                削除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number | null | undefined;
}) {
  const stringValue = value?.toString() || "未設定";
  const shouldWrap = stringValue.length > 20;

  return (
    <div className="flex items-center space-x-3 p-3 bg-background rounded-lg shadow-sm">
      <div className="text-primary">{icon}</div>
      <div className={`flex-1 ${shouldWrap ? "flex flex-col" : ""}`}>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold text-foreground">{stringValue}</p>
      </div>
    </div>
  );
}
