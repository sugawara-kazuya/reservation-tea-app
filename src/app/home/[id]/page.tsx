"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generateClient } from "aws-amplify/data";
import { CalendarIcon, PhoneIcon, UsersIcon, CoinsIcon } from "@/avator/icons"; // 正しいパスに変更してください
import type { Schema } from "@/amplify";
import { Amplify } from "aws-amplify";
import outputs from "@/output";

Amplify.configure(outputs);

const client = generateClient<Schema>();

export default function Component() {
  const router = useRouter();
  const { id: eventIdParam } = useParams();
  const eventId = Array.isArray(eventIdParam) ? eventIdParam[0] : eventIdParam;
  const [participants, setParticipants] = useState(1);
  const [event, setEvent] = useState<Schema["Event"]["type"] | null>(null);
  const [timeSlots, setTimeSlots] = useState<Schema["EventTimeSlot"]["type"][]>(
    []
  );
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [showBanner, setShowBanner] = useState(false);
  const [bannerMessage, setBannerMessage] = useState("");

  const fetchEvent = async () => {
    if (!eventId) {
      console.error(
        "Event ID が存在しません。URLに正しいパスが含まれているか確認してください。"
      );
      return;
    }

    const { data: eventData } = await client.models.Event.get({
      id: eventId,
    });
    setEvent(eventData);

    if (eventData?.id) {
      const { data: timeSlotData } = await client.models.EventTimeSlot.list({
        filter: { eventId: { eq: eventData.id } },
      });

      const sortedTimeSlots = timeSlotData.sort((a, b) => {
        if (!a.timeSlot && !b.timeSlot) return 0;
        if (!a.timeSlot) return 1;
        if (!b.timeSlot) return -1;
        return a.timeSlot.localeCompare(b.timeSlot);
      });

      setTimeSlots(sortedTimeSlots);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const handleReservation = async () => {
    if (!event?.id || !selectedTimeSlot || !name || !email || !phone) {
      setBannerMessage("すべてのフィールドを入力してください。");
      setShowBanner(true);
      return;
    }

    const selectedSlot = timeSlots.find(
      (slot) => slot.timeSlot === selectedTimeSlot
    );

    if (selectedSlot) {
      const maxParticipants = selectedSlot.maxParticipants ?? 0; // maxParticipants が null または undefined の場合は 0 を使用
      const totalParticipants =
        (selectedSlot.currentParticipants ?? 0) + participants;
      if (totalParticipants > maxParticipants) {
        setBannerMessage("上限人数に達しています。予約ができません。");
        setShowBanner(true);
        return; // 上限を超えている場合は処理を中断
      }
    }

    const totalCost = (event.cost ?? 0) * participants;

    try {
      const { data: newReservation, errors: reservationErrors } =
        await client.models.Reservation.create({
          name,
          email,
          phone,
          eventId: event?.id,
          reservationTime: selectedTimeSlot,
          participants,
          totalCost,
          notes,
        });

      if (reservationErrors || !newReservation) {
        console.error("予約の作成中にエラーが発生しました:", reservationErrors);
        return;
      }

      if (selectedSlot) {
        const updatedTimeSlot = {
          id: selectedSlot.id,
          currentParticipants:
            (selectedSlot.currentParticipants ?? 0) + participants,
        };
        const { data: updatedSlotData, errors: timeSlotErrors } =
          await client.models.EventTimeSlot.update(updatedTimeSlot);

        if (timeSlotErrors) {
          console.error(
            "EventTimeSlot の更新中にエラーが発生しました:",
            timeSlotErrors
          );
          return;
        }
      }

      if (event?.id) {
        const updatedEvent = {
          id: event.id,
          currentParticipants: (event.currentParticipants ?? 0) + participants,
        };
        const { data: updatedEventData, errors: eventErrors } =
          await client.models.Event.update(updatedEvent);

        if (eventErrors) {
          console.error("Event の更新中にエラーが発生しました:", eventErrors);
          return;
        }
      }

      router.push(`/home/reservation/${newReservation.id}`);
    } catch (error) {
      console.error("予約の作成または更新に失敗しました:", error);
    }
  };

  const handleParticipantsSelect = (selectedParticipants: number) => {
    setParticipants(selectedParticipants);
  };

  const handleTimeSlotSelect = (timeSlot: string) => {
    setSelectedTimeSlot(timeSlot);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16">
      {showBanner && (
        <div className="bg-red-500 text-white text-center py-2 mb-4">
          {bannerMessage}
        </div>
      )}
      <div className="space-y-6 md:space-y-8">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold">予約画面</h1>
          <p className="text-muted-foreground mt-2 md:mt-3">
            茶道のお茶席を予約します。
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          <div className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="name">名前</Label>
              <Input
                id="name"
                placeholder="名前を入力してください"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">メール</Label>
              <Input
                id="email"
                type="email"
                placeholder="メールアドレスを入力してください"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">電話番号</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="電話番号を入力してください"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date-time">日時</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 justify-start">
                    <span className="font-medium">
                      {selectedTimeSlot ?? "時間を選択"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 max-w-[276px] w-full">
                  <div className="grid grid-cols-1 gap-2 p-4">
                    {timeSlots.map((slot) => (
                      <Button
                        key={slot.id}
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          slot.timeSlot && handleTimeSlotSelect(slot.timeSlot)
                        }
                      >
                        {slot.timeSlot} (予約済み {slot.currentParticipants}/
                        {slot.maxParticipants}名)
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="participants">参加人数</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 justify-start">
                    <span className="font-medium">{participants}名</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 max-w-[276px] w-full">
                  <div className="grid grid-cols-1 gap-2 p-4">
                    {[1, 2, 3, 4].map((number) => (
                      <Button
                        key={number}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleParticipantsSelect(number)}
                      >
                        {number}名
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">追加メモ</Label>
              <Textarea
                id="notes"
                rows={4}
                placeholder="追加のメモやリクエストを入力してください"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <Button
              type="button"
              className="w-full"
              onClick={handleReservation}
            >
              予約する
            </Button>
          </div>
          <div className="space-y-6">
            {/* 予約の詳細や他の情報を表示する部分 */}
            {event && (
              <>
                <div className="grid gap-2">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold">{event.title}</h2>
                  </div>
                  <div className="flex items-center gap-4">
                    <CalendarIcon className="w-6 h-6" />
                    <div>
                      <div className="font-medium">{event.date}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <PhoneIcon className="w-6 h-6" />
                    <div className="font-medium">{event.venue}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <CoinsIcon className="w-6 h-6" />
                    <div className="font-medium">{event.cost}円</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <UsersIcon className="w-6 h-6" />
                    <div className="font-medium">
                      席数 {event.currentParticipants} / {event.maxParticipants}
                      名
                    </div>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>追加メモ</Label>
                  <div className="text-muted-foreground">
                    {event.description}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Image
                    src={event.imageUrl || ""}
                    alt="Event Image"
                    width={500}
                    height={300}
                    layout="responsive"
                    objectFit="cover"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
