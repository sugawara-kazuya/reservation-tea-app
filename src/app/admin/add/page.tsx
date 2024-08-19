"use client";

import { useState } from "react";
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
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import TimePicker from "react-time-picker";
import { useRouter } from "next/navigation";

// Amplifyのクライアントを生成
const client = generateClient<Schema>();

type TimeSlot = {
  startTime: string;
  maxParticipants: number;
};

export default function CreateComponent() {
  const [teaPartyName, setTeaPartyName] = useState("");
  const [visibility, setVisibility] = useState(true);
  const [venue, setVenue] = useState("");
  const [cost, setCost] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [currentParticipants, setCurrentParticipants] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [description, setDescription] = useState("");
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    { startTime: "10:00", maxParticipants: 10 },
  ]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const router = useRouter(); // useRouterのインスタンスを作成

  const handleAddTimeSlot = () => {
    setTimeSlots([...timeSlots, { startTime: "", maxParticipants: 1 }]);
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
    setTimeSlots(updatedTimeSlots);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleCreate = async () => {
    try {
      let imageUrl = "";
      // local
      // const baseUrl =
      //   "https://amplify-moshimoji-root-sandbox-1-teabucket26470cb4-m9df2bygeb2t.s3.ap-northeast-1.amazonaws.com/";
      // dev
      const baseUrl =
        "https://amplify-d2zzbrnh9ajitz-dev-branc-teabucket26470cb4-ttvps8lvvdyb.s3.ap-northeast-1.amazonaws.com/";

      if (selectedFile) {
        const path = `event/${selectedFile.name}`;
        await uploadData({
          path,
          data: selectedFile,
        });
        imageUrl = baseUrl + path; // アップロードされたファイルのパスにリンクを追加
      }

      // Eventを作成
      const { data: createdEvent, errors: eventErrors } =
        await client.models.Event.create({
          title: teaPartyName,
          venue,
          date: date ? format(date, "M月d日（EEE）", { locale: ja }) : "",
          cost: parseInt(cost, 10),
          description,
          imageUrl: imageUrl, // アップロードされたファイルのURLを設定
          maxParticipants: parseInt(maxParticipants, 10),
          currentParticipants: parseInt(currentParticipants, 10),
          isActive: visibility,
        });

      if (eventErrors) {
        console.error("Error creating event:", eventErrors);
        return;
      }

      // EventTimeSlotを作成
      for (const slot of timeSlots) {
        const { data: createdTimeSlot, errors: timeSlotErrors } =
          await client.models.EventTimeSlot.create({
            eventId: createdEvent?.id,
            timeSlot: slot.startTime,
            maxParticipants: slot.maxParticipants,
            currentParticipants: 0,
          });

        if (timeSlotErrors) {
          console.error("Error creating time slot:", timeSlotErrors);
        }
      }

      console.log("Event and time slots created successfully");

      // 作成完了後に/adminにリダイレクト
      router.push("/admin");
    } catch (error) {
      console.error("Failed to create event or time slots:", error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center mb-6">
        <ArrowLeftIcon
          className="w-6 h-6 cursor-pointer"
          onClick={() => window.history.back()}
        />
        <h1 className="text-xl font-bold ml-2">お茶会作成</h1>
      </div>
      <p className="text-muted-foreground mb-6">
        新しいお茶会の情報を入力してください。
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
          <Input
            id="cost"
            placeholder="例: 1000"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="max-participants">最大参加人数</Label>
          <Input
            id="max-participants"
            placeholder="例: 60"
            value={maxParticipants}
            onChange={(e) => setMaxParticipants(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="current-participants">現在の参加人数</Label>
          <Input
            id="current-participants"
            placeholder="例: 0"
            value={currentParticipants}
            onChange={(e) => setCurrentParticipants(e.target.value)}
          />
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
                {date
                  ? format(date, "M月d日（EEE）", { locale: ja })
                  : "日付を選択"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
              />
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <Label>時間の管理</Label>
          <div className="space-y-2">
            {timeSlots.map((slot, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-1/3">
                      {slot.startTime ? slot.startTime : "時間を選択"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[350px] p-0">
                    <TimePicker
                      onChange={(value) =>
                        handleChangeTimeSlot(index, "startTime", value || "")
                      }
                      value={slot.startTime}
                      disableClock={true}
                      clearIcon={null}
                      className="w-full p-2 rounded-md border"
                    />
                  </PopoverContent>
                </Popover>
                <select
                  value={slot.maxParticipants.toString()}
                  onChange={(e) =>
                    handleChangeTimeSlot(
                      index,
                      "maxParticipants",
                      e.target.value
                    )
                  }
                  className="w-1/3 p-2 border rounded-md pr-6"
                >
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
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
          onClick={handleCreate}
        >
          作成完了
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
      viewBox="0 0 24"
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
      viewBox="0 0 24"
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
