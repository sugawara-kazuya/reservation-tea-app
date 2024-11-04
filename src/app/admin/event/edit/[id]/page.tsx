"use client";

import { useState, useEffect, useCallback } from "react";
import { generateClient } from "aws-amplify/data";
import { uploadData } from "aws-amplify/storage";
import type { Schema } from "@/amplify";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { format, parse } from "date-fns";
import { ja } from "date-fns/locale";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import outputs from "@/output";
import { Amplify } from "aws-amplify";
import { toast } from "@/hooks/use-toast";

Amplify.configure(outputs);

const client = generateClient<Schema>();

type TimeSlot = {
  id?: string; // 既存または新規のタイムスロットを区別
  hour: string;
  minute: string;
  maxParticipants: number;
};

interface EventTimeSlot {
  id: string;
  timeSlot: string;
  maxParticipants: number;
}

const sortTimeSlots = (slots: TimeSlot[]): TimeSlot[] => {
  return slots.sort((a, b) => {
    const timeA = parseInt(a.hour) * 60 + parseInt(a.minute);
    const timeB = parseInt(b.hour) * 60 + parseInt(b.minute);
    return timeA - timeB;
  });
};

export default function EditComponent({ params }: { params: { id: string } }) {
  const [teaPartyName, setTeaPartyName] = useState("");
  const [visibility, setVisibility] = useState(true);
  const [venue, setVenue] = useState("");
  const [cost, setCost] = useState("1500");
  const [maxParticipants, setMaxParticipants] = useState(0);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [description, setDescription] = useState("");
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [eventId, setEventId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [errors, setErrors] = useState({
    teaPartyName: false,
    venue: false,
    image: false,
    description: false,
  });
  const [isRemoveTimeSlotModalOpen, setIsRemoveTimeSlotModalOpen] =
    useState(false);
  const [timeSlotToRemove, setTimeSlotToRemove] = useState<{
    index: number;
    hasReservations: boolean;
  } | null>(null);
  const [duplicateTimeSlotError, setDuplicateTimeSlotError] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setIsLoading(true);
        const { data: event, errors: eventErrors } =
          await client.models.Event.get({ id: params.id });
        if (eventErrors) {
          throw new Error(
            "イベントの取得中にエラーが発生しました: " +
              eventErrors.map((e) => e.message).join(", ")
          );
        }
        if (event) {
          setTeaPartyName(event.title ?? "");
          setVisibility(event.isActive ?? true);
          setVenue(event.venue ?? "");
          setCost(event.cost?.toString() || "0");
          setMaxParticipants(event.maxParticipants || 0);

          // 日付のパースを修正
          let parsedDate;
          if (event.date) {
            // 日本語フォーマットでパース
            parsedDate = parse(event.date, "yyyy年M月d日（EEE）", new Date(), {
              locale: ja,
            });
            if (isNaN(parsedDate.getTime())) {
              // パースに失敗した場合は現在の日付を使用
              parsedDate = new Date();
            }
          }
          setDate(parsedDate || undefined);

          setDescription(event.description || "");
          setEventId(event.id ?? "");
          setImageUrl(event.imageUrl ?? "");

          const { data: timeSlotsData, errors: timeSlotErrors } =
            await client.models.EventTimeSlot.list({
              filter: { eventId: { eq: event.id ?? undefined } },
            });

          if (timeSlotErrors) {
            throw new Error(
              "タイムスロットの取得中にエラーが発生しました: " +
                timeSlotErrors.map((e) => e.message).join(", ")
            );
          }

          if (timeSlotsData) {
            const timeSlotItems = timeSlotsData as EventTimeSlot[];
            setTimeSlots(
              sortTimeSlots(
                timeSlotItems.map((timeSlot) => ({
                  id: timeSlot.id, // idを追加
                  hour: timeSlot.timeSlot.split(":")[0],
                  minute: timeSlot.timeSlot.split(":")[1],
                  maxParticipants: timeSlot.maxParticipants,
                }))
              )
            );
          }
        }
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "不明なエラーが発生しました"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [params.id]);

  useEffect(() => {
    const total = timeSlots.reduce(
      (sum, slot) => sum + slot.maxParticipants,
      0
    );
    setMaxParticipants(total);
  }, [timeSlots]);

  const validateForm = () => {
    const newErrors = {
      teaPartyName: teaPartyName.trim() === "",
      venue: venue.trim() === "",
      image: imageUrl.trim() === "" && !selectedFile,
      description: description.trim() === "",
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleAddTimeSlot = () => {
    if (timeSlots.length > 0) {
      const lastSlot = timeSlots[timeSlots.length - 1];
      let newHour = parseInt(lastSlot.hour, 10) + 1;
      let newMinute = lastSlot.minute;

      if (newHour >= 24) {
        newHour = 0;
      }

      setTimeSlots(
        sortTimeSlots([
          ...timeSlots,
          {
            hour: newHour.toString().padStart(2, "0"),
            minute: newMinute,
            maxParticipants: 10,
          },
        ])
      );
    } else {
      setTimeSlots([
        {
          hour: "10",
          minute: "00",
          maxParticipants: 10,
        },
      ]);
    }
  };

  const handleRemoveTimeSlot = useCallback(
    async (index: number) => {
      const slot = timeSlots[index];
      const timeSlotString = `${slot.hour}:${slot.minute}`;

      if (slot.id) {
        try {
          // 予約の有無を確認
          const { data: reservations, errors: reservationErrors } =
            await client.models.Reservation.list({
              filter: {
                eventId: { eq: eventId },
                reservationTime: { eq: timeSlotString },
              },
            });

          if (reservationErrors) {
            throw new Error("予約の確認中にエラーが発生しました");
          }

          const hasReservations = reservations.length > 0;

          // モーダルを表示するために状態を更新
          setTimeSlotToRemove({ index, hasReservations });
          setIsRemoveTimeSlotModalOpen(true);
        } catch (error) {
          console.error("時間枠の削除確認中にエラーが発生しました:", error);
          setError(
            error instanceof Error
              ? error.message
              : "時間枠の削除確認に失敗しました"
          );
        }
      } else {
        // 新規追加された時間枠の場合はローカルからのみ削除
        setTimeSlots(timeSlots.filter((_, i) => i !== index));
      }
    },
    [timeSlots, eventId]
  );

  const confirmRemoveTimeSlot = useCallback(async () => {
    if (timeSlotToRemove === null) return;

    const { index, hasReservations } = timeSlotToRemove;
    const slot = timeSlots[index];
    const timeSlotString = `${slot.hour}:${slot.minute}`;

    if (!slot.id) {
      // 新規追加された時間枠の場合はローカルからのみ削除
      setTimeSlots(timeSlots.filter((_, i) => i !== index));
      setIsRemoveTimeSlotModalOpen(false);
      setTimeSlotToRemove(null);
      return;
    }

    try {
      // EventTimeSlotを削除
      const { data: eventTimeSlots, errors: eventTimeSlotErrors } =
        await client.models.EventTimeSlot.list({
          filter: {
            eventId: { eq: eventId },
            timeSlot: { eq: timeSlotString },
          },
        });

      if (eventTimeSlotErrors) {
        throw new Error("EventTimeSlotの取得中にエラーが発生しました");
      }

      if (eventTimeSlots.length === 0) {
        throw new Error("該当するEventTimeSlotが見つかりません");
      }

      const eventTimeSlot = eventTimeSlots[0];
      const currentParticipantsToRemove =
        eventTimeSlot.currentParticipants || 0;

      // EventTimeSlotを削除
      const { errors: deleteErrors } = await client.models.EventTimeSlot.delete(
        {
          id: eventTimeSlot.id,
        }
      );
      if (deleteErrors) {
        throw new Error("EventTimeSlotの削除中にエラーが発生しました");
      }

      if (hasReservations) {
        // 関連する予約を削除
        const { data: reservations, errors: reservationErrors } =
          await client.models.Reservation.list({
            filter: {
              eventId: { eq: eventId },
              reservationTime: { eq: timeSlotString },
            },
          });

        if (reservationErrors) {
          throw new Error("予約の取得中にエラーが発生しました");
        }

        for (const reservation of reservations) {
          const { errors: deleteErrors } =
            await client.models.Reservation.delete({ id: reservation.id });
          if (deleteErrors) {
            throw new Error("予約の削除中にエラーが発生しました");
          }
        }
      }

      // イベントの現在の参加者数を更新
      const { data: event, errors: getEventErrors } =
        await client.models.Event.get({ id: eventId });
      if (getEventErrors) {
        throw new Error("イベントの取得中にエラーが発生しました");
      }

      if (event) {
        const updatedCurrentParticipants = Math.max(
          (event.currentParticipants || 0) - currentParticipantsToRemove,
          0
        );
        const { errors: updateEventErrors } = await client.models.Event.update({
          id: eventId,
          currentParticipants: updatedCurrentParticipants,
        });

        if (updateEventErrors) {
          throw new Error("イベントの更新中にエラーが発生しました");
        }
      } else {
        throw new Error("イベントが見つかりません");
      }

      // ローカルの状態を更新
      setTimeSlots(timeSlots.filter((_, i) => i !== index));
      setIsRemoveTimeSlotModalOpen(false);
      setTimeSlotToRemove(null);
    } catch (error) {
      console.error(
        "タイムスロットと予約の削除中にエラーが発生しました:",
        error
      );
      setError(
        error instanceof Error
          ? error.message
          : "タイムスロットと予約の削除に失敗しました"
      );
    }
  }, [timeSlotToRemove, timeSlots, eventId]);

  const handleChangeTimeSlot = (
    index: number,
    field: keyof TimeSlot,
    value: string
  ) => {
    const updatedTimeSlots = timeSlots.map((slot, i) =>
      i === index
        ? {
            ...slot,
            [field]: field === "maxParticipants" ? parseInt(value, 10) : value,
          }
        : slot
    );
    setTimeSlots(sortTimeSlots(updatedTimeSlots));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    if (file) {
      setErrors((prevErrors) => ({ ...prevErrors, image: false }));
    } else {
      setErrors((prevErrors) => ({
        ...prevErrors,
        image: imageUrl.trim() === "",
      }));
    }
  };

  const generateHourOptions = () => {
    return Array.from({ length: 14 }, (_, i) => i + 7).map((hour) =>
      hour.toString().padStart(2, "0")
    );
  };

  const generateMinuteOptions = () => {
    return Array.from({ length: 6 }, (_, i) =>
      (i * 10).toString().padStart(2, "0")
    );
  };

  const generateCostOptions = () => {
    return Array.from({ length: 99 }, (_, i) => (100 + i * 100).toString());
  };

  const hourOptions = generateHourOptions();
  const minuteOptions = generateMinuteOptions();
  const costOptions = generateCostOptions();

  const checkDuplicateTimeSlots = () => {
    const timeSlotStrings = timeSlots.map(
      (slot) => `${slot.hour}:${slot.minute}`
    );
    const uniqueTimeSlots = new Set(timeSlotStrings);
    return timeSlotStrings.length !== uniqueTimeSlots.size;
  };

  const handleUpdate = async () => {
    if (!validateForm()) {
      console.error("Validation failed");
      return;
    }

    if (checkDuplicateTimeSlots()) {
      setDuplicateTimeSlotError(true);
      toast({
        title: "エラー",
        description: "重複する予約時間があります。時間を確認してください。",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      let newImageUrl = imageUrl;
      const baseUrl = `https://${outputs.storage.bucket_name}.s3.ap-northeast-1.amazonaws.com/`;

      if (selectedFile) {
        const path = `event/${selectedFile.name}`;
        await uploadData({
          path,
          data: selectedFile,
        });
        newImageUrl = baseUrl + path;
      }

      // 日付を日本語形式で保存
      let formattedDate = "";
      if (date && !isNaN(date.getTime())) {
        formattedDate = format(date, "yyyy年MM月dd日（EEE）", { locale: ja });
      }

      // イベントの更新
      const { data: updatedEvent, errors: eventErrors } =
        await client.models.Event.update({
          id: eventId,
          title: teaPartyName,
          venue,
          date: formattedDate,
          cost: parseInt(cost, 10),
          description,
          imageUrl: newImageUrl || undefined,
          maxParticipants,
          isActive: visibility,
        });

      if (eventErrors) {
        throw new Error(
          "イベントの更新中にエラーが発生しました: " +
            eventErrors.map((e) => e.message).join(", ")
        );
      }

      // 既存のタイムスロットを取得
      const { data: existingTimeSlots, errors: fetchErrors } =
        await client.models.EventTimeSlot.list({
          filter: { eventId: { eq: eventId } },
        });

      if (fetchErrors) {
        throw new Error(
          "既存のタイムスロットの取得中にエラーが発生しました: " +
            fetchErrors.map((e) => e.message).join(", ")
        );
      }

      // タイムスロットの更新または作成
      for (const slot of timeSlots) {
        const timeSlotString = `${slot.hour}:${slot.minute}`;
        const existingSlot = existingTimeSlots.find(
          (es) => es?.timeSlot === timeSlotString
        );

        if (existingSlot) {
          // 既存のスロットを更新
          const { errors: updateErrors } =
            await client.models.EventTimeSlot.update({
              id: existingSlot.id,
              maxParticipants: slot.maxParticipants,
            });

          if (updateErrors) {
            console.error(
              "タイムスロットの更新中にエラーが発生しました:",
              updateErrors
            );
          }
        } else {
          // 新しいスロットを作成
          const { errors: createErrors, data: newSlot } =
            await client.models.EventTimeSlot.create({
              eventId: eventId,
              timeSlot: timeSlotString,
              maxParticipants: slot.maxParticipants,
              currentParticipants: 0,
            });

          if (createErrors) {
            console.error(
              "タイムスロットの作成中にエラーが発生しました:",
              createErrors
            );
          } else if (newSlot) {
            // 新しく作成されたスロットにidを設定
            setTimeSlots((prevSlots) =>
              prevSlots.map((s) =>
                s.hour === slot.hour && s.minute === slot.minute && !s.id
                  ? { ...s, id: newSlot.id ?? undefined }
                  : s
              )
            );
          }
        }
      }

      // 削除されたスロットを削除
      for (const existingSlot of existingTimeSlots) {
        if (existingSlot && existingSlot.timeSlot) {
          const [hour, minute] = existingSlot.timeSlot.split(":");
          if (
            !timeSlots.some(
              (slot) => slot.hour === hour && slot.minute === minute
            )
          ) {
            const { errors: deleteErrors } =
              await client.models.EventTimeSlot.delete({
                id: existingSlot.id,
              });

            if (deleteErrors) {
              console.error(
                "タイムスロットの削除中にエラーが発生しました:",
                deleteErrors
              );
            }
          }
        }
      }

      console.log("イベントとタイムスロットが正常に更新されました");
      router.push("/admin");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "イベントまたはタイムスロットの更新に失敗しました"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      const { errors } = await client.models.Event.delete({ id: eventId });
      if (errors) {
        throw new Error(
          "イベントの削除中にエラーが発生しました: " +
            errors.map((e) => e.message).join(", ")
        );
      }
      console.log("イベントが正常に削除されました");
      router.push("/admin");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "イベントの削除に失敗しました"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getErrorCount = () => {
    return (
      Object.values(errors).filter(Boolean).length +
      (duplicateTimeSlotError ? 1 : 0)
    );
  };

  if (isLoading) {
    return <div>読み込み中...</div>;
  }

  if (error) {
    return <div>エラー: {error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <ArrowLeftIcon
            className="w-6 h-6 cursor-pointer"
            onClick={() => window.history.back()}
          />
          <h1 className="text-xl font-bold ml-2">お茶会編集</h1>
        </div>
        <Button
          variant="ghost"
          className="text-red-500"
          onClick={() => setIsDeleteModalOpen(true)}
        >
          <TrashIcon className="w-6 h-6" />
        </Button>
      </div>
      <p className="text-muted-foreground mb-6">
        お茶会の情報を編集してください。
      </p>
      <div className="space-y-6">
        <div>
          <Label
            htmlFor="tea-party-name"
            className={errors.teaPartyName ? "text-red-500" : ""}
          >
            お茶会名 *
          </Label>
          <Input
            id="tea-party-name"
            placeholder="例: 七夕茶会"
            value={teaPartyName}
            onChange={(e) => {
              setTeaPartyName(e.target.value);
              setErrors({ ...errors, teaPartyName: false });
            }}
            className={errors.teaPartyName ? "border-red-500" : ""}
          />
          {errors.teaPartyName && (
            <p className="text-red-500 text-sm mt-1">
              お茶会名を入力してください
            </p>
          )}
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="visibility">表示・非表示</Label>
          <Switch
            id="visibility"
            checked={visibility}
            onCheckedChange={setVisibility}
          />
        </div>
        <div>
          <Label htmlFor="venue" className={errors.venue ? "text-red-500" : ""}>
            会場 *
          </Label>
          <Input
            id="venue"
            placeholder="例: 紅葉園"
            value={venue}
            onChange={(e) => {
              setVenue(e.target.value);
              setErrors({ ...errors, venue: false });
            }}
            className={errors.venue ? "border-red-500" : ""}
          />
          {errors.venue && (
            <p className="text-red-500 text-sm mt-1">会場を入力してください</p>
          )}
        </div>
        <div>
          <Label htmlFor="cost">一人当たりの参加費用</Label>
          <Select value={cost} onValueChange={setCost}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="参加費用を選択" />
            </SelectTrigger>
            <SelectContent>
              {costOptions.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}円
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>時間の管理</Label>
          <div className="space-y-2">
            {timeSlots.map((slot, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Select
                  value={slot.hour}
                  onValueChange={(value) =>
                    handleChangeTimeSlot(index, "hour", value)
                  }
                >
                  <SelectTrigger className="w-1/4">
                    <SelectValue placeholder="時" />
                  </SelectTrigger>
                  <SelectContent>
                    {hourOptions.map((hour) => (
                      <SelectItem key={hour} value={hour}>
                        {hour}時
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={slot.minute}
                  onValueChange={(value) =>
                    handleChangeTimeSlot(index, "minute", value)
                  }
                >
                  <SelectTrigger className="w-1/4">
                    <SelectValue placeholder="分" />
                  </SelectTrigger>
                  <SelectContent>
                    {minuteOptions.map((minute) => (
                      <SelectItem key={minute} value={minute}>
                        {minute}分
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={slot.maxParticipants.toString()}
                  onValueChange={(value) =>
                    handleChangeTimeSlot(index, "maxParticipants", value)
                  }
                >
                  <SelectTrigger className="w-1/4">
                    <SelectValue placeholder="人数" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 50 }, (_, i) =>
                      (i + 1).toString()
                    ).map((num) => (
                      <SelectItem key={num} value={num}>
                        {num}人
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  className="w-10 h-10"
                  onClick={() => handleRemoveTimeSlot(index)}
                >
                  <MinusIcon className="w-6 h-6" />
                </Button>
              </div>
            ))}
            {duplicateTimeSlotError && (
              <p className="text-red-500 text-sm mt-1">
                重複する予約時間があります。時間を確認してください。
              </p>
            )}
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={handleAddTimeSlot}
            >
              <PlusIcon className="w-6 h-6" />
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="max-participants">総参加人数（自動計算）</Label>
          <div className="flex items-center space-x-2">
            <Input
              id="max-participants"
              value={maxParticipants}
              readOnly
              className="bg-gray-100 text-gray-700 cursor-not-allowed"
            />
            <span className="text-sm text-muted-foreground">人</span>
          </div>
          <p className="text-sm text-muted-foreground">
            この値は各時間枠の参加人数の合計で自動的に計算されます。直接編集することはできません。
          </p>
        </div>
        <div>
          <Label
            htmlFor="image-upload"
            className={errors.image ? "text-red-500" : ""}
          >
            画像の選択 {imageUrl ? "" : "*"}
          </Label>
          <input
            type="file"
            id="image-upload"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            variant="outline"
            className={`w-full mt-2 ${errors.image ? "border-red-500" : ""}`}
            onClick={() => document.getElementById("image-upload")?.click()}
          >
            {selectedFile
              ? selectedFile.name
              : imageUrl
                ? "現在の画像が設定されています"
                : "ファイルを選択"}
          </Button>
          {/* 画像のプレビューを追加 */}
          {selectedFile ? (
            <img
              src={URL.createObjectURL(selectedFile)}
              alt="選択した画像のプレビュー"
              className="mt-2 w-full h-auto"
            />
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt="現在の画像"
              className="mt-2 w-full h-auto"
            />
          ) : null}
          {errors.image && (
            <p className="text-red-500 text-sm mt-1">画像を選択してください</p>
          )}
        </div>
        <div>
          <Label htmlFor="date">日にち</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full">
                {date && !isNaN(date.getTime())
                  ? format(date, "yyyy年M月d日（EEE）", { locale: ja })
                  : "日付を選択"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
              <Calendar
                mode="single"
                selected={date && !isNaN(date.getTime()) ? date : undefined}
                onSelect={setDate}
                className="rounded-md border"
              />
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <Label
            htmlFor="description"
            className={errors.description ? "text-red-500" : ""}
          >
            お茶会の説明 *
          </Label>
          <Textarea
            id="description"
            placeholder="例: 各席8〜12名（45分）どなたでも参加いただけます。（服装自由）"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setErrors({ ...errors, description: false });
            }}
            className={`min-h-[100px] ${
              errors.description ? "border-red-500" : ""
            }`}
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">
              お茶会の説明を入力してください
            </p>
          )}
        </div>
        <div className="flex flex-col items-center space-y-2">
          {getErrorCount() > 0 && (
            <p className="text-red-500 text-sm">
              {getErrorCount()}件のエラーが発生しています。
            </p>
          )}
          <Button
            className="w-full bg-green-500 text-white"
            onClick={handleUpdate}
            disabled={
              Object.values(errors).some(Boolean) ||
              duplicateTimeSlotError ||
              isLoading
            }
          >
            {isLoading ? "更新中..." : "編集完了"}
          </Button>
        </div>
      </div>

      {/* イベント削除用のアラートダイアログ */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>イベントを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。本当にこのイベントを削除してもよろしいですか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* タイムスロット削除用のアラートダイアログ */}
      <AlertDialog
        open={isRemoveTimeSlotModalOpen}
        onOpenChange={setIsRemoveTimeSlotModalOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>時間枠を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この時間枠を削除すると、関連するすべての予約も削除されます。本当に削除してもよろしいですか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTimeSlotToRemove(null)}>
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveTimeSlot}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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

function MinusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12h20" />
    </svg>
  );
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

function TrashIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}
