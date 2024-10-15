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
import { format, parse, isValid } from "date-fns";
import { ja } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

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
  const [accompaniedGuests, setAccompaniedGuests] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventTimeSlots, setEventTimeSlots] = useState<
    Schema["EventTimeSlot"]["type"][]
  >([]);
  const [event, setEvent] = useState<Schema["Event"]["type"] | null>(null);
  const [reservationNumber, setReservationNumber] = useState("");
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState("");
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
        console.log("取得した予約データ:", data);
        setReservation(data);
        setName(data.name || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
        setParticipants(data.participants?.toString() || "");
        setNotes(data.notes || "");
        setReservationNumber(data.reservationNumber || "");
        setAccompaniedGuests(
          [
            data.accompaniedGuest1 || "",
            data.accompaniedGuest2 || "",
            data.accompaniedGuest3 || "",
          ].slice(0, (data.participants || 1) - 1)
        );

        if (data.eventId) {
          await fetchEvent(data.eventId);
          await fetchEventTimeSlots(data.eventId);
        }

        if (data.reservationTime) {
          console.log("予約時間ID:", data.reservationTime);
          await fetchEventTimeSlot(data.reservationTime);
        } else {
          console.error("予約時間が設定されていません");
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
        console.log("取得したイベントデータ:", data);
        setEvent(data);
        if (data.date) {
          console.log("イベントの日付文字列:", data.date);
          // date-fnsのparseを使用して日付をパース
          const parsedDate = parse(
            data.date,
            "yyyy年M月d日（EEE）",
            new Date(),
            { locale: ja }
          );
          console.log("パースされたイベントの日付:", parsedDate);
          if (!isNaN(parsedDate.getTime())) {
            setDate(parsedDate);
          } else {
            console.error("イベントの日付が無効です:", data.date);
          }
        } else {
          console.error("イベントの日付が設定されていません");
        }
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

        // 現在の予約時間が時間スロットに存在する場合、それを選択状態にする
        if (time) {
          const matchingSlot = sortedData.find(
            (slot) => slot.timeSlot === time
          );
          if (matchingSlot) {
            setTime(matchingSlot.timeSlot || "");
          }
        }
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

  const fetchEventTimeSlot = async (timeSlotId: string) => {
    try {
      const { data, errors } = await client.models.EventTimeSlot.get({
        id: timeSlotId,
      });
      if (errors) {
        throw new Error(errors.map((e) => e.message).join(", "));
      }
      if (data && data.timeSlot) {
        console.log("取得した時間スロット:", data);
        setTime(data.timeSlot);
      } else {
        console.error("時間スロットが見つかりません");
      }
    } catch (error) {
      console.error("時間スロットの取得中にエラーが発生しました:", error);
    }
  };

  const handleUpdate = async () => {
    if (!reservation || !event || !date) return;

    try {
      const oldParticipants = reservation.participants || 0;
      const newParticipants = parseInt(participants, 10);
      const participantsDiff = newParticipants - oldParticipants;

      // 選択された時間スロットのIDを取得
      const selectedTimeSlot = eventTimeSlots.find(
        (slot) => slot.timeSlot === time
      );
      if (!selectedTimeSlot) {
        throw new Error("選択された時間スロットが見つかりません");
      }

      // Update reservation
      const { errors: reservationErrors } =
        await client.models.Reservation.update({
          id: reservationId,
          name,
          email,
          phone,
          reservationTime: selectedTimeSlot.id, // 時間スロットのIDを保存
          participants: newParticipants,
          totalCost: event.cost ? event.cost * newParticipants : 0,
          notes,
          accompaniedGuest1: accompaniedGuests[0] || null,
          accompaniedGuest2: accompaniedGuests[1] || null,
          accompaniedGuest3: accompaniedGuests[2] || null,
          reservationNumber,
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
      router.push(`/admin/event/info/${event.id}`);
    } catch (error) {
      console.error("予約の更新中にエラーが発生しました:", error);
      setError(
        error instanceof Error
          ? error.message
          : "予約の更新中に未知のエラーが発生しました。"
      );
    }
  };

  const handleParticipantsChange = (value: string) => {
    const newParticipantsCount = parseInt(value, 10);
    setParticipants(value);

    const newAccompaniedGuests = [...accompaniedGuests];
    if (newParticipantsCount > 1) {
      while (newAccompaniedGuests.length < newParticipantsCount - 1) {
        newAccompaniedGuests.push("");
      }
      newAccompaniedGuests.length = newParticipantsCount - 1;
    } else {
      newAccompaniedGuests.length = 0;
    }
    setAccompaniedGuests(newAccompaniedGuests);
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleAccompaniedGuestChange = (index: number, value: string) => {
    const newAccompaniedGuests = [...accompaniedGuests];
    newAccompaniedGuests[index] = value;
    setAccompaniedGuests(newAccompaniedGuests);
  };

  console.log("現在の日付状態:", date);
  console.log("現在の時間状態:", time);

  if (loading) {
    return <div>読み込み中...</div>;
  }

  if (error) {
    return <div>エラー: {error}</div>;
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
          <Label htmlFor="date">日にち</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                {date && !isNaN(date.getTime())
                  ? format(date, "yyyy年M月d日（EEE）", { locale: ja })
                  : "日付が設定されていません"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date || new Date()}
                onSelect={(newDate) => setDate(newDate || null)}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <Label htmlFor="time">時間</Label>
          <Select value={time} onValueChange={setTime}>
            <SelectTrigger>
              <SelectValue placeholder="時間を選択" />
            </SelectTrigger>
            <SelectContent>
              {eventTimeSlots.map((slot) => (
                <SelectItem key={slot.id} value={slot.timeSlot || ""}>
                  {slot.timeSlot}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="participants">参加人数</Label>
          <Select value={participants} onValueChange={handleParticipantsChange}>
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
        {accompaniedGuests.map((guest, index) => (
          <div key={index}>
            <Label htmlFor={`accompaniedGuest${index + 1}`}>
              同行者 {index + 1}
            </Label>
            <Input
              id={`accompaniedGuest${index + 1}`}
              value={guest}
              onChange={(e) =>
                handleAccompaniedGuestChange(index, e.target.value)
              }
              placeholder={`同行者 ${index + 1} の名前`}
            />
          </div>
        ))}
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
        <div>
          <Label htmlFor="reservationNumber">予約番号</Label>
          <Input id="reservationNumber" value={reservationNumber} disabled />
        </div>
        <Button onClick={handleUpdate} className="w-full">
          更新
        </Button>
      </div>
    </div>
  );
}
