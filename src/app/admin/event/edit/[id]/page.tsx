"use client";

import { useState, useEffect } from "react";
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
import { format } from "date-fns";
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

Amplify.configure(outputs);

const client = generateClient<Schema>();

type TimeSlot = {
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
  const [eventId, setEventId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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
          setDate(event.date ? new Date(event.date) : undefined);
          setDescription(event.description || "");
          setEventId(event.id ?? "");

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

  const handleRemoveTimeSlot = (index: number) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  };

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

  const handleUpdate = async () => {
    try {
      setIsLoading(true);
      let imageUrl = "";
      const baseUrl = `https://${outputs.storage.bucket_name}.s3.ap-northeast-1.amazonaws.com/`;

      if (selectedFile) {
        const path = `event/${selectedFile.name}`;
        await uploadData({
          path,
          data: selectedFile,
        });
        imageUrl = baseUrl + path;
      }

      let formattedDate = "";
      if (date && !isNaN(date.getTime())) {
        formattedDate = format(date, "yyyy年M月d日（EEE）", { locale: ja });
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
          imageUrl: imageUrl || undefined,
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
          const { errors: createErrors } =
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
          <Label htmlFor="tea-party-name">お茶会名</Label>
          <Input
            id="tea-party-name"
            placeholder="例: 七夕茶会"
            value={teaPartyName}
            onChange={(e) => setTeaPartyName(e.target.value)}
          />
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
          <Label htmlFor="venue">会場</Label>
          <Input
            id="venue"
            placeholder="例: 紅葉園"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
          />
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
                  <MinusIcon className="w-10 h-10" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={handleAddTimeSlot}
            >
              <PlusIcon className="w-6 h-6" />
            </Button>
          </div>
        </div>
        <div>
          <Label htmlFor="max-participants">総参加人数（自動計算）</Label>
          <Input id="max-participants" value={maxParticipants} readOnly />
        </div>
        <div>
          <Label htmlFor="image-upload">画像の選択</Label>
          <input
            type="file"
            id="image-upload"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            variant="outline"
            className="w-full mt-2"
            onClick={() => document.getElementById("image-upload")?.click()}
          >
            {selectedFile ? selectedFile.name : "ファイルを選択"}
          </Button>
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
          <Label htmlFor="description">お茶会の説明</Label>
          <Textarea
            id="description"
            placeholder="例: 各席8〜12名（45分）どなたでも参加いただけます。（服装自由）"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
        <Button
          className="w-full bg-green-500 text-white"
          onClick={handleUpdate}
          disabled={isLoading}
        >
          {isLoading ? "更新中..." : "編集完了"}
        </Button>
      </div>

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
