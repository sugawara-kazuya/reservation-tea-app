"use client";

import { useState, useEffect, useRef } from "react";
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
import type { Schema } from "@/amplify";
import { Amplify } from "aws-amplify";
import outputs from "@/output";

Amplify.configure(outputs);

const client = generateClient<Schema>();

type Errors = {
  name?: string;
  email?: string;
  phone?: string;
  timeSlot?: string;
  accompaniedGuests?: (string | undefined)[];
};

function generateReservationNumber(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default function ReservationComponent() {
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
  const [accompaniedGuests, setAccompaniedGuests] = useState<string[]>([]);
  const [errors, setErrors] = useState<Errors>({});

  const [isTimePopoverOpen, setIsTimePopoverOpen] = useState(false);
  const [isParticipantsPopoverOpen, setIsParticipantsPopoverOpen] =
    useState(false);
  const timePopoverRef = useRef<HTMLDivElement>(null);
  const participantsPopoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        timePopoverRef.current &&
        !timePopoverRef.current.contains(event.target as Node)
      ) {
        setIsTimePopoverOpen(false);
      }
      if (
        participantsPopoverRef.current &&
        !participantsPopoverRef.current.contains(event.target as Node)
      ) {
        setIsParticipantsPopoverOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

  const validateEmail = (email: string): string | null => {
    if (!email) {
      return "メールアドレスを入力してください。";
    }
    if (email.includes("＠")) {
      return "メールアドレスの@が全角になっています。半角の@を使用してください。";
    }
    if (!email.includes("@")) {
      return "正しいメールアドレスを入力してください。";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "正しいメールアドレスを入力してください。";
    }
    return null;
  };

  const validatePhone = (phone: string): string | null => {
    if (!phone) {
      return "電話番号を入力してください。";
    }
    const cleanedPhone = phone.replace(/[\s\-]/g, "");
    if (!/^\d{10,11}$/.test(cleanedPhone)) {
      return "正しい電話番号を入力してください。";
    }
    return null;
  };

  const handleReservation = async () => {
    const newErrors: Errors = {
      name: name ? undefined : "名前を入力してください。",
      email: validateEmail(email) ?? undefined,
      phone: validatePhone(phone) ?? undefined,
      timeSlot: selectedTimeSlot ? undefined : "時間を選択してください。",
      accompaniedGuests: accompaniedGuests.map((guest) =>
        guest ? undefined : "同行者の名前を入力してください。"
      ),
    };
    setErrors(newErrors);

    if (
      Object.values(newErrors).some((error) =>
        Array.isArray(error)
          ? error.some((e) => e !== undefined)
          : error !== undefined
      )
    ) {
      setBannerMessage("入力に誤りがあります。各項目を確認してください。");
      setShowBanner(true);
      return;
    }

    try {
      // 予約内容の重複チェック
      const { data: existingReservations, errors: listErrors } =
        await client.models.Reservation.list({
          filter: {
            and: [
              { eventId: { eq: event?.id ?? "" } },
              { reservationTime: { eq: selectedTimeSlot ?? "" } },
              { name: { eq: name ?? "" } },
              { email: { eq: email ?? "" } },
            ],
          },
        });

      if (listErrors) {
        console.error("予約リストの取得中にエラーが発生しました:", listErrors);
        setBannerMessage(
          "予約チェック中にエラーが発生しました。もう一度お試しください。"
        );
        setShowBanner(true);
        return;
      }

      if (existingReservations && existingReservations.length > 0) {
        setBannerMessage("すでに同じ内容の予約があります。");
        setShowBanner(true);
        return;
      }

      // イベントの参加者数チェック
      if (
        event &&
        event.maxParticipants !== undefined &&
        event.maxParticipants !== null
      ) {
        const totalParticipants =
          (event.currentParticipants || 0) + participants;
        if (totalParticipants > event.maxParticipants) {
          setBannerMessage("申し訳ありませんが、イベントの定員に達しました。");
          setShowBanner(true);
          return;
        }
      }

      // 選択された時間枠の参加者数チェック
      if (selectedTimeSlot) {
        const selectedSlot = timeSlots.find(
          (slot) => slot.id === selectedTimeSlot
        );
        if (selectedSlot && selectedSlot.maxParticipants !== null) {
          const totalSlotParticipants =
            (selectedSlot.currentParticipants || 0) + participants;
          if (
            selectedSlot.maxParticipants !== undefined &&
            totalSlotParticipants > selectedSlot.maxParticipants
          ) {
            setBannerMessage(
              "申し訳ありませんが、選択された時間枠の定員に達しました。"
            );
            setShowBanner(true);
            return;
          }
        }
      }

      // ランダムな予約番号の生成と重複チェック
      let reservationNumber;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10; // 最大試行回数を設定

      while (!isUnique && attempts < maxAttempts) {
        reservationNumber = generateReservationNumber();
        attempts++;

        const { data: existingReservationNumbers, errors: checkErrors } =
          await client.models.Reservation.list({
            filter: { reservationNumber: { eq: reservationNumber } },
          });

        if (checkErrors) {
          console.error(
            "予約番号チェック中にエラーが発生しました:",
            checkErrors
          );
          throw new Error("予約番号の確認中にエラーが発生しました。");
        }

        if (
          !existingReservationNumbers ||
          existingReservationNumbers.length === 0
        ) {
          isUnique = true;
        }
      }

      if (!isUnique) {
        throw new Error("一意の予約番号を生成できませんでした。");
      }

      // 予約の作成
      const { data: newReservation, errors: reservationErrors } =
        await client.models.Reservation.create({
          name,
          email,
          phone,
          eventId: event?.id,
          reservationTime: selectedTimeSlot,
          participants,
          totalCost: (event?.cost ?? 0) * participants,
          notes,
          accompaniedGuest1: accompaniedGuests[0] || null,
          accompaniedGuest2: accompaniedGuests[1] || null,
          accompaniedGuest3: accompaniedGuests[2] || null,
          reservationNumber,
        });

      if (reservationErrors || !newReservation) {
        throw new Error("予約の作成中にエラーが発生しました。");
      }

      // 時間枠の更新
      if (selectedTimeSlot) {
        const selectedSlot = timeSlots.find(
          (slot) => slot.id === selectedTimeSlot
        );
        if (selectedSlot) {
          const updatedTimeSlot = {
            id: selectedSlot.id,
            currentParticipants:
              (selectedSlot.currentParticipants || 0) + participants,
          };
          const { errors: timeSlotErrors } =
            await client.models.EventTimeSlot.update(updatedTimeSlot);

          if (timeSlotErrors) {
            console.error(
              "EventTimeSlot の更新中にエラーが発生しました:",
              timeSlotErrors
            );
            // エラー処理を追加する場合はここに記述
          }
        }
      }

      // イベントの更新
      if (event?.id) {
        const updatedEvent = {
          id: event.id,
          currentParticipants: (event.currentParticipants || 0) + participants,
        };
        const { errors: eventErrors } =
          await client.models.Event.update(updatedEvent);

        if (eventErrors) {
          console.error("Event の更新中にエラーが発生しました:", eventErrors);
          // エラー処理を追加する場合はここに記述
        }
      }

      router.push(`/home/reservation/${newReservation.id}`);
    } catch (error) {
      console.error("予約の作成または更新に失敗しました:", error);
      setBannerMessage("予約の作成に失敗しました。もう一度お試しください。");
      setShowBanner(true);
    }
  };

  const handleParticipantsSelect = (selectedParticipants: number) => {
    setParticipants(selectedParticipants);
    setAccompaniedGuests(Array(selectedParticipants - 1).fill(""));
  };

  const handleTimeSlotSelect = (timeSlotId: string) => {
    setSelectedTimeSlot(timeSlotId);
  };

  const handleAccompaniedGuestChange = (index: number, value: string) => {
    const newAccompaniedGuests = [...accompaniedGuests];
    newAccompaniedGuests[index] = value;
    setAccompaniedGuests(newAccompaniedGuests);
  };

  const selectedTimeSlotTime = selectedTimeSlot
    ? timeSlots.find((slot) => slot.id === selectedTimeSlot)?.timeSlot
    : null;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16">
      {showBanner && (
        <div className="bg-red-500 text-white text-center py-2 mb-4 flex justify-between items-center">
          <span>{bannerMessage}</span>
        </div>
      )}
      <div className="space-y-6 md:space-y-8">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          <div className="space-y-6">
            {/* 名前入力 */}
            <div className="grid gap-2">
              <Label
                htmlFor="name"
                className={errors.name ? "text-red-500" : ""}
              >
                名前 * (必須)
              </Label>
              <Input
                id="name"
                placeholder="名前を入力してください"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`select-text ${errors.name ? "border-red-500" : ""}`}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* メール入力 */}
            <div className="grid gap-2">
              <Label
                htmlFor="email"
                className={errors.email ? "text-red-500" : ""}
              >
                メール * (必須)
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="メールアドレスを入力してください"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`select-text ${
                  errors.email ? "border-red-500" : ""
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* 電話番号入力 */}
            <div className="grid gap-2">
              <Label
                htmlFor="phone"
                className={errors.phone ? "text-red-500" : ""}
              >
                電話番号 * (必須)
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="電話番号を入力してください"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`select-text ${
                  errors.phone ? "border-red-500" : ""
                }`}
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
              )}
            </div>

            {/* 日時選択 */}
            <div className="grid gap-2" ref={timePopoverRef}>
              <Label
                htmlFor="date-time"
                className={errors.timeSlot ? "text-red-500" : ""}
              >
                日時 * (必須)
              </Label>
              <Popover
                open={isTimePopoverOpen}
                onOpenChange={setIsTimePopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`flex-1 justify-start ${
                      errors.timeSlot ? "border-red-500" : ""
                    }`}
                  >
                    <span className="font-medium">
                      {selectedTimeSlotTime ?? "時間を選択"}
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
                        onClick={() => {
                          if (slot.id) {
                            handleTimeSlotSelect(slot.id);
                            setIsTimePopoverOpen(false);
                          } else {
                            console.error("タイムスロットIDが見つかりません");
                          }
                        }}
                      >
                        {slot.timeSlot} (予約済み {slot.currentParticipants}/
                        {slot.maxParticipants}名)
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              {errors.timeSlot && (
                <p className="text-red-500 text-sm mt-1">{errors.timeSlot}</p>
              )}
            </div>

            {/* 参加人数選択 */}
            <div className="grid gap-2" ref={participantsPopoverRef}>
              <Label htmlFor="participants">参加人数</Label>
              <Popover
                open={isParticipantsPopoverOpen}
                onOpenChange={setIsParticipantsPopoverOpen}
              >
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
                        onClick={() => {
                          handleParticipantsSelect(number);
                          setIsParticipantsPopoverOpen(false);
                        }}
                      >
                        {number}名
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* 同行者入力 */}
            {accompaniedGuests.map((guest, index) => (
              <div key={index} className="grid gap-2">
                <Label
                  htmlFor={`accompaniedGuest${index + 1}`}
                  className={
                    errors.accompaniedGuests && errors.accompaniedGuests[index]
                      ? "text-red-500"
                      : ""
                  }
                >
                  同行者 {index + 1} *
                </Label>
                <Input
                  id={`accompaniedGuest${index + 1}`}
                  placeholder={`同行者 ${index + 1} の名前`}
                  value={guest}
                  onChange={(e) =>
                    handleAccompaniedGuestChange(index, e.target.value)
                  }
                  className={`select-text ${
                    errors.accompaniedGuests && errors.accompaniedGuests[index]
                      ? "border-red-500"
                      : ""
                  }`}
                />
                {errors.accompaniedGuests &&
                  errors.accompaniedGuests[index] && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.accompaniedGuests[index]}
                    </p>
                  )}
              </div>
            ))}

            {/* 追加メモ */}
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

            {/* 予約ボタン */}
            <Button
              type="button"
              className="w-full"
              onClick={handleReservation}
            >
              予約する
            </Button>
          </div>

          {/* イベント情報表示 */}
          <div className="space-y-6">
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
                    src={event.imageUrl || "/default-image.jpg"}
                    alt="Event Image"
                    width={500}
                    height={300}
                    className="object-cover rounded-md"
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

// SVG Icons

function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}

function PhoneIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
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
      viewBox="0 0 24 24"
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

function CoinsIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <path d="M7 6h1v4" />
      <path d="m16.71 13.88.7.71-2.82 2.82" />
    </svg>
  );
}
