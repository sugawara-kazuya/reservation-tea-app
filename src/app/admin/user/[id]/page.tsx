"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Amplify } from "aws-amplify";
import outputs from "@/output";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify";

Amplify.configure(outputs);

const client = generateClient<Schema>();

function ArrowLeftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}

export default function ReservationEdit() {
  const [reservation, setReservation] = useState<
    Schema["Reservation"]["type"] | null
  >(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [reservationTime, setReservationTime] = useState("");
  const [participants, setParticipants] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventTimeSlots, setEventTimeSlots] = useState<
    Schema["EventTimeSlot"]["type"][]
  >([]);
  const [event, setEvent] = useState<Schema["Event"]["type"] | null>(null);
  const router = useRouter();
  const params = useParams();
  const reservationId = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    if (reservationId) {
      fetchReservation(reservationId);
    } else {
      setLoading(false);
      setError("予約IDが見つかりません。");
    }
  }, [reservationId]);

  const fetchReservation = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, errors } = await client.models.Reservation.get({ id });
      if (errors) {
        throw new Error(errors.map((e) => e.message).join(", "));
      }
      if (data) {
        setReservation(data);
        setName(data.name || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
        setReservationTime(data.reservationTime || "");
        setParticipants(data.participants?.toString() || "");
        setNotes(data.notes || "");

        if (data.eventId) {
          await fetchEvent(data.eventId);
          await fetchEventTimeSlots(data.eventId);
        }
      } else {
        throw new Error("予約が見つかりません。");
      }
    } catch (error) {
      console.error("予約の取得中にエラーが発生しました:", error);
      setError(
        error instanceof Error
          ? error.message
          : "予約の取得中に未知のエラーが発生しました。"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchEvent = async (eventId: string) => {
    try {
      const { data, errors } = await client.models.Event.get({ id: eventId });
      if (errors) {
        throw new Error(errors.map((e) => e.message).join(", "));
      }
      if (data) {
        setEvent(data);
      }
    } catch (error) {
      console.error("イベントの取得中にエラーが発生しました:", error);
      setError(
        error instanceof Error
          ? error.message
          : "イベントの取得中に未知のエラーが発生しました。"
      );
    }
  };

  const fetchEventTimeSlots = async (eventId: string) => {
    try {
      const { data, errors } = await client.models.EventTimeSlot.list({
        filter: { eventId: { eq: eventId } },
      });
      if (errors) {
        throw new Error(errors.map((e) => e.message).join(", "));
      }
      if (data) {
        const sortedData = data.sort((a, b) => {
          if (a.timeSlot && b.timeSlot) {
            return a.timeSlot.localeCompare(b.timeSlot);
          }
          return 0;
        });
        setEventTimeSlots(sortedData);
      }
    } catch (error) {
      console.error("時間スロットの取得中にエラーが発生しました:", error);
      setError(
        error instanceof Error
          ? error.message
          : "時間スロットの取得中に未知のエラーが発生しました。"
      );
    }
  };

  const handleUpdate = async () => {
    if (!reservation || !event) return;

    try {
      const oldParticipants = reservation.participants || 0;
      const newParticipants = parseInt(participants, 10);
      const participantsDiff = newParticipants - oldParticipants;

      // Update reservation
      const { errors: reservationErrors } =
        await client.models.Reservation.update({
          id: reservationId,
          name,
          email,
          phone,
          reservationTime,
          participants: newParticipants,
          totalCost: event.cost ? event.cost * newParticipants : 0,
          notes,
        });

      if (reservationErrors) {
        throw new Error(reservationErrors.map((e) => e.message).join(", "));
      }

      // Update Event's currentParticipants
      const updatedEvent = {
        id: event.id,
        currentParticipants:
          (event.currentParticipants || 0) + participantsDiff,
      };
      const { errors: eventErrors } =
        await client.models.Event.update(updatedEvent);

      if (eventErrors) {
        throw new Error(eventErrors.map((e) => e.message).join(", "));
      }

      // Update EventTimeSlot's currentParticipants
      const timeSlot = eventTimeSlots.find(
        (slot) => slot.timeSlot === reservationTime
      );
      if (timeSlot) {
        const updatedTimeSlot = {
          id: timeSlot.id,
          currentParticipants:
            (timeSlot.currentParticipants || 0) + participantsDiff,
        };
        const { errors: timeSlotErrors } =
          await client.models.EventTimeSlot.update(updatedTimeSlot);

        if (timeSlotErrors) {
          throw new Error(timeSlotErrors.map((e) => e.message).join(", "));
        }
      }

      console.log("予約が正常に更新されました");
      router.push(`/admin/holder/${event.id}`);
    } catch (error) {
      console.error("予約の更新中にエラーが発生しました:", error);
      setError(
        error instanceof Error
          ? error.message
          : "予約の更新中に未知のエラーが発生しました。"
      );
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!reservation) {
    return <div>予約が見つかりません。</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={handleGoBack} className="mr-4">
          <ArrowLeftIcon className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold">予約編集</h1>
      </div>
      <div className="space-y-6">
        <div>
          <Label htmlFor="name">お名前</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="email">メールアドレス</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="phone">電話番号</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="reservationTime">予約時間</Label>
          <Select value={reservationTime} onValueChange={setReservationTime}>
            <SelectTrigger>
              <SelectValue placeholder="予約時間を選択" />
            </SelectTrigger>
            <SelectContent>
              {eventTimeSlots.map((slot) => (
                <SelectItem key={slot.id} value={slot.timeSlot || ""}>
                  {slot.timeSlot} (残り
                  {(slot.maxParticipants || 0) -
                    (slot.currentParticipants || 0) +
                    (reservation.reservationTime === slot.timeSlot
                      ? parseInt(participants, 10)
                      : 0)}{" "}
                  /{slot.maxParticipants || 0})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="participants">参加人数</Label>
          <Select value={participants} onValueChange={setParticipants}>
            <SelectTrigger>
              <SelectValue placeholder="参加人数を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1人</SelectItem>
              <SelectItem value="2">2人</SelectItem>
              <SelectItem value="3">3人</SelectItem>
              <SelectItem value="4">4人</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="totalCost">総費用</Label>
          <Input
            id="totalCost"
            type="number"
            value={(event?.cost || 0) * parseInt(participants, 10)}
            disabled
          />
        </div>
        <div>
          <Label htmlFor="notes">メモ</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <Button onClick={handleUpdate} className="w-full">
          更新
        </Button>
      </div>
    </div>
  );
}
