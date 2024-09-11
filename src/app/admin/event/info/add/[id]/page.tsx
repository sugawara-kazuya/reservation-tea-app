"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Amplify } from "aws-amplify";
import outputs from "@/output";
Amplify.configure(outputs);

const client = generateClient<Schema>();

export default function ReservationCreate() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [reservationTime, setReservationTime] = useState("");
  const [participants, setParticipants] = useState("1");
  const [notes, setNotes] = useState("");
  const [event, setEvent] = useState<Schema["Event"]["type"] | null>(null);
  const [timeSlots, setTimeSlots] = useState<Schema["EventTimeSlot"]["type"][]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEventData();
  }, [eventId]);

  const fetchEventData = async () => {
    if (!eventId) {
      setError("イベントIDが指定されていません。");
      setLoading(false);
      return;
    }

    try {
      const { data: eventData, errors: eventErrors } =
        await client.models.Event.get({ id: eventId });
      if (eventErrors) throw new Error(JSON.stringify(eventErrors));
      if (!eventData) throw new Error("イベントが見つかりません。");
      setEvent(eventData);

      const { data: timeSlotsData, errors: timeSlotErrors } =
        await client.models.EventTimeSlot.list({
          filter: { eventId: { eq: eventId } },
        });
      if (timeSlotErrors) throw new Error(JSON.stringify(timeSlotErrors));

      // Sort time slots
      const sortedTimeSlots = timeSlotsData.sort((a, b) => {
        if (a.timeSlot && b.timeSlot) {
          return a.timeSlot.localeCompare(b.timeSlot);
        }
        return 0;
      });

      setTimeSlots(sortedTimeSlots);
    } catch (error) {
      console.error("Error fetching event data:", error);
      setError(`データの取得中にエラーが発生しました: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!event) {
      setError("イベント情報が取得できませんでした。");
      return;
    }

    const totalCost = event.cost ? event.cost * parseInt(participants, 10) : 0;

    try {
      // 1. Create the reservation
      const { errors: reservationErrors, data: newReservation } =
        await client.models.Reservation.create({
          name,
          email,
          phone,
          reservationTime,
          participants: parseInt(participants, 10),
          totalCost,
          notes,
          eventId,
        });

      if (reservationErrors) {
        throw new Error(JSON.stringify(reservationErrors));
      }

      // 2. Update the Event's currentParticipants
      const updatedEvent = {
        id: event.id,
        currentParticipants:
          (event.currentParticipants || 0) + parseInt(participants, 10),
      };
      const { errors: eventUpdateErrors } =
        await client.models.Event.update(updatedEvent);

      if (eventUpdateErrors) {
        throw new Error(JSON.stringify(eventUpdateErrors));
      }

      // 3. Update the EventTimeSlot's currentParticipants
      const timeSlot = timeSlots.find(
        (slot) => slot.timeSlot === reservationTime
      );
      if (timeSlot) {
        const updatedTimeSlot = {
          id: timeSlot.id,
          currentParticipants:
            (timeSlot.currentParticipants || 0) + parseInt(participants, 10),
        };
        const { errors: timeSlotUpdateErrors } =
          await client.models.EventTimeSlot.update(updatedTimeSlot);

        if (timeSlotUpdateErrors) {
          throw new Error(JSON.stringify(timeSlotUpdateErrors));
        }
      }

      console.log("Reservation created successfully:", newReservation);
      router.push(`/admin/event/info/${eventId}`);
    } catch (error) {
      console.error("Failed to create reservation:", error);
      setError(`予約の作成中にエラーが発生しました: ${error}`);
    }
  };

  if (loading) {
    return <div>データを読み込んでいます...</div>;
  }

  if (error) {
    return <div>エラー: {error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center mb-6">
        <ArrowLeftIcon
          className="w-6 h-6 cursor-pointer"
          onClick={() => router.back()}
        />
        <h1 className="text-xl font-bold ml-2">新規予約作成</h1>
      </div>
      <p className="text-muted-foreground mb-6">
        新しい予約を作成します。必要な情報を入力してください。
      </p>
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
          <Label htmlFor="reservation-time">予約時間</Label>
          <Select value={reservationTime} onValueChange={setReservationTime}>
            <SelectTrigger>
              <SelectValue placeholder="予約時間を選択" />
            </SelectTrigger>
            <SelectContent>
              {timeSlots.map((slot) => (
                <SelectItem key={slot.id} value={slot.timeSlot ?? ""}>
                  {slot.timeSlot ?? "時間未設定"} (残席{" "}
                  {(slot.maxParticipants ?? 0) -
                    (slot.currentParticipants ?? 0)}{" "}
                  / {slot.maxParticipants ?? 0})
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
          <Label htmlFor="notes">メモ</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
        <Button
          className="w-full bg-green-500 text-white"
          onClick={handleCreate}
        >
          予約を作成
        </Button>
      </div>
    </div>
  );
}

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
