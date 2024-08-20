"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { generateClient } from "aws-amplify/data";
import { uploadData } from "aws-amplify/storage";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import TimePicker from "react-time-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Amplify } from "aws-amplify";
import outputs from "@/output";
import type { Schema } from "@/amplify";
import { parse } from "date-fns";

Amplify.configure(outputs);

const client = generateClient<Schema>();

type TimeSlot = {
  id: string;
  startTime: string;
  maxParticipants: number;
};

export default function EventDetail() {
  const [event, setEvent] = useState<Schema["Event"]["type"] | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [deletedTimeSlots, setDeletedTimeSlots] = useState<string[]>([]);
  const [teaPartyName, setTeaPartyName] = useState("");
  const [visibility, setVisibility] = useState(true);
  const [venue, setVenue] = useState("");
  const [cost, setCost] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [currentParticipants, setCurrentParticipants] = useState("");
  const [date, setDate] = useState<Date | null>(null);
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const router = useRouter();
  const params = useParams();
  const eventId = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    if (eventId) {
      fetchEvent(eventId);
    } else {
      console.error("No eventId found in URL");
    }
  }, [eventId]);

  const fetchEvent = async (eventId: string) => {
    try {
      const { data, errors } = await client.models.Event.get({ id: eventId });
      if (errors) {
        console.error("Error fetching event:", errors);
        return;
      }
      if (data) {
        setEvent(data);
        setTeaPartyName(data.title || "");
        setVisibility(data.isActive || false);
        setVenue(data.venue || "");
        setCost(data.cost?.toString() || "");
        setMaxParticipants(data.maxParticipants?.toString() || "");
        setCurrentParticipants(data.currentParticipants?.toString() || "");
        setDescription(data.description || "");
        setImageUrl(data.imageUrl || "");

        // 日付をパースしてDateオブジェクトに変換
        const eventDate = data.date
          ? parse(data.date, "yyyy年M月d日(EEE)", new Date(), { locale: ja })
          : null;
        setDate(eventDate);

        const timeSlotResult = await data.eventTimeSlots();
        const slots: TimeSlot[] =
          timeSlotResult?.data?.map((slot) => ({
            id: slot.id ?? "",
            startTime: slot.timeSlot ?? "",
            maxParticipants: slot.maxParticipants || 0,
          })) || [];

        slots.sort((a, b) => {
          const timeA = parseInt(a.startTime.replace(":", ""), 10);
          const timeB = parseInt(b.startTime.replace(":", ""), 10);
          return timeA - timeB;
        });

        setTimeSlots(slots);
      }
    } catch (error) {
      console.error("Unexpected error fetching event:", error);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleAddTimeSlot = () => {
    setTimeSlots([...timeSlots, { id: "", startTime: "", maxParticipants: 0 }]);
  };

  const handleRemoveTimeSlot = (index: number) => {
    const slotToRemove = timeSlots[index];
    if (slotToRemove.id) {
      setDeletedTimeSlots((prev) => [...prev, slotToRemove.id]);
    }
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

    updatedTimeSlots.sort((a, b) => {
      const timeA = parseInt(a.startTime.replace(":", ""), 10);
      const timeB = parseInt(b.startTime.replace(":", ""), 10);
      return timeA - timeB;
    });

    setTimeSlots(updatedTimeSlots);
  };

  const handleUpdate = async () => {
    try {
      let updatedImageUrl = imageUrl;
      const baseUrl =
        "https://amplify-d2zzbrnh9ajitz-dev-branc-teabucket26470cb4-ttvps8lvvdyb.s3.ap-northeast-1.amazonaws.com/";

      if (selectedFile) {
        const path = `event/${selectedFile.name}`;
        await uploadData({
          path,
          data: selectedFile,
        });
        updatedImageUrl = baseUrl + path;
      }

      const formattedDate = date
        ? format(date, "yyyy年M月d日(EEE)", { locale: ja })
        : "";

      const { errors } = await client.models.Event.update({
        id: eventId,
        title: teaPartyName,
        venue,
        date: formattedDate,
        cost: parseInt(cost, 10),
        description,
        imageUrl: updatedImageUrl,
        maxParticipants: parseInt(maxParticipants, 10),
        currentParticipants: parseInt(currentParticipants, 10),
        isActive: visibility,
      });

      if (errors) {
        console.error("Error updating event:", errors);
        return;
      }

      for (const slot of timeSlots) {
        if (slot.id) {
          const { errors: timeSlotErrors } =
            await client.models.EventTimeSlot.update({
              id: slot.id,
              eventId: eventId,
              timeSlot: slot.startTime,
              maxParticipants: slot.maxParticipants,
              currentParticipants: 0,
            });

          if (timeSlotErrors) {
            console.error("Error updating time slot:", timeSlotErrors);
          }
        } else {
          const { errors: timeSlotErrors } =
            await client.models.EventTimeSlot.create({
              eventId: eventId,
              timeSlot: slot.startTime,
              maxParticipants: slot.maxParticipants,
              currentParticipants: 0,
            });

          if (timeSlotErrors) {
            console.error("Error creating time slot:", timeSlotErrors);
          }
        }
      }

      for (const slotId of deletedTimeSlots) {
        const { errors: deleteErrors } =
          await client.models.EventTimeSlot.delete({
            id: slotId,
          });

        if (deleteErrors) {
          console.error("Error deleting time slot:", deleteErrors);
        } else {
          console.log("Time slot deleted successfully:", slotId);
        }
      }

      console.log("Event and time slots updated successfully");
      router.push("/admin");
    } catch (error) {
      console.error("Failed to update event or time slots:", error);
    }
  };

  if (!event) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center mb-6">
        <ArrowLeftIcon
          className="w-6 h-6 cursor-pointer"
          onClick={() => router.back()}
        />
        <h1 className="text-xl font-bold ml-2">お茶会詳細</h1>
      </div>
      <p className="text-muted-foreground mb-6">
        お茶会の情報を編集することができます。
      </p>
      <div className="space-y-6">
        <div>
          <Label htmlFor="tea-party-name">お茶会名</Label>
          <Input
            id="tea-party-name"
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
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="cost">一人当たりの参加費用</Label>
          <Input
            id="cost"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="max-participants">最大参加人数</Label>
          <Input
            id="max-participants"
            value={maxParticipants}
            onChange={(e) => setMaxParticipants(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="current-participants">現在の参加人数</Label>
          <Input
            id="current-participants"
            value={currentParticipants}
            onChange={(e) => setCurrentParticipants(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="date">日にち</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full">
                {date instanceof Date && !isNaN(date.getTime())
                  ? format(date, "yyyy年M月d日(EEE)", { locale: ja })
                  : "日付を選択"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
              <Calendar
                mode="single"
                selected={date || undefined}
                onSelect={(selectedDate) => {
                  console.log("Selected Date:", selectedDate); // デバッグログを追加
                  setDate(selectedDate ?? null);
                }}
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
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
        <div>
          <Label htmlFor="image-upload">画像の編集</Label>
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
          {imageUrl && (
            <img src={imageUrl} alt="Event Image" className="mt-4 rounded-lg" />
          )}
        </div>
        <Button
          className="w-full bg-green-500 text-white"
          onClick={handleUpdate}
        >
          編集完了
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
