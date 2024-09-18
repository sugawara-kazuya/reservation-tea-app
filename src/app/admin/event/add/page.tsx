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

const client = generateClient<Schema>();

type TimeSlot = {
  hour: string;
  minute: string;
  maxParticipants: number;
};

export default function CreateComponent() {
  const [teaPartyName, setTeaPartyName] = useState("");
  const [visibility, setVisibility] = useState(true);
  const [venue, setVenue] = useState("");
  const [cost, setCost] = useState("1500");
  const [maxParticipants, setMaxParticipants] = useState(0);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [description, setDescription] = useState("");
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    { hour: "10", minute: "00", maxParticipants: 10 },
    { hour: "11", minute: "00", maxParticipants: 10 },
    { hour: "12", minute: "00", maxParticipants: 10 },
    { hour: "13", minute: "00", maxParticipants: 10 },
    { hour: "14", minute: "00", maxParticipants: 10 },
  ]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errors, setErrors] = useState({
    teaPartyName: false,
    venue: false,
    image: false,
    description: false,
  });

  const router = useRouter();

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
      image: !selectedFile,
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

      setTimeSlots([
        ...timeSlots,
        {
          hour: newHour.toString().padStart(2, "0"),
          minute: newMinute,
          maxParticipants: 10,
        },
      ]);
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
    setTimeSlots(updatedTimeSlots);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setErrors({ ...errors, image: !file });
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

  const handleCreate = async () => {
    if (!validateForm()) {
      console.error("Validation failed");
      return;
    }

    try {
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

      const formattedDate = date
        ? format(date, "yyyy年M月d日（EEE）", { locale: ja })
        : "";

      const { data: createdEvent, errors: eventErrors } =
        await client.models.Event.create({
          title: teaPartyName,
          venue,
          date: formattedDate,
          cost: parseInt(cost, 10),
          description,
          imageUrl: imageUrl,
          maxParticipants,
          currentParticipants: 0,
          isActive: visibility,
        });

      if (eventErrors) {
        console.error("Error creating event:", eventErrors);
        return;
      }

      for (const slot of timeSlots) {
        const { errors: timeSlotErrors } =
          await client.models.EventTimeSlot.create({
            eventId: createdEvent?.id,
            timeSlot: `${slot.hour}:${slot.minute}`,
            maxParticipants: slot.maxParticipants,
            currentParticipants: 0,
          });

        if (timeSlotErrors) {
          console.error("Error creating time slot:", timeSlotErrors);
        }
      }

      console.log("Event and time slots created successfully");
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
            画像の選択 *
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
            {selectedFile ? selectedFile.name : "ファイルを選択"}
          </Button>
          {errors.image && (
            <p className="text-red-500 text-sm mt-1">画像を選択してください</p>
          )}
        </div>
        <div>
          <Label htmlFor="date">日にち</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full">
                {date
                  ? format(date, "yyyy年M月d日（EEE）", { locale: ja })
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
            className={`min-h-[100px] ${errors.description ? "border-red-500" : ""}`}
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">
              お茶会の説明を入力してください
            </p>
          )}
        </div>
        <Button
          className="w-full bg-green-500 text-white"
          onClick={handleCreate}
          disabled={Object.values(errors).some(Boolean)}
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
