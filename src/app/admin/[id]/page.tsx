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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Amplify } from "aws-amplify";
import outputs from "@/output";
import type { Schema } from "@/amplify";
import { parse } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

Amplify.configure(outputs);

const client = generateClient<Schema>();

type TimeSlot = {
  id: string;
  hour: string;
  minute: string;
  maxParticipants: number;
};

export default function EventDetail() {
  const [event, setEvent] = useState<Schema["Event"]["type"] | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [deletedTimeSlots, setDeletedTimeSlots] = useState<string[]>([]);
  const [teaPartyName, setTeaPartyName] = useState("");
  const [visibility, setVisibility] = useState(true);
  const [venue, setVenue] = useState("");
  const [cost, setCost] = useState("1500");
  const [maxParticipants, setMaxParticipants] = useState(0);
  const [date, setDate] = useState<Date | undefined>(undefined);
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

  useEffect(() => {
    const total = timeSlots.reduce(
      (sum, slot) => sum + slot.maxParticipants,
      0
    );
    setMaxParticipants(total);
  }, [timeSlots]);

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
        setCost(data.cost?.toString() || "1500");
        setDescription(data.description || "");
        setImageUrl(data.imageUrl || "");

        const eventDate = data.date
          ? parse(data.date, "yyyy年M月d日(EEE)", new Date(), { locale: ja })
          : undefined;
        setDate(eventDate);

        const timeSlotResult = await data.eventTimeSlots();
        const slots: TimeSlot[] =
          timeSlotResult?.data?.map((slot) => ({
            id: slot.id ?? "",
            hour: slot.timeSlot?.split(":")[0] ?? "07",
            minute: slot.timeSlot?.split(":")[1] ?? "00",
            maxParticipants: slot.maxParticipants || 0,
          })) || [];

        slots.sort((a, b) => {
          const timeA = parseInt(a.hour + a.minute, 10);
          const timeB = parseInt(b.hour + b.minute, 10);
          return timeA - timeB;
        });

        setTimeSlots(
          slots.length > 0
            ? slots
            : [
                { id: "", hour: "10", minute: "00", maxParticipants: 10 },
                { id: "", hour: "11", minute: "00", maxParticipants: 10 },
                { id: "", hour: "12", minute: "00", maxParticipants: 10 },
                { id: "", hour: "13", minute: "00", maxParticipants: 10 },
                { id: "", hour: "14", minute: "00", maxParticipants: 10 },
              ]
        );
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
    if (timeSlots.length > 0) {
      const lastSlot = timeSlots[timeSlots.length - 1];
      let newHour = parseInt(lastSlot.hour, 10) + 1;
      let newMinute = lastSlot.minute;

      // 新しい時間が24時を超える場合はリセット
      if (newHour >= 24) {
        newHour = 0;
      }

      setTimeSlots([
        ...timeSlots,
        {
          id: "",
          hour: newHour.toString().padStart(2, "0"),
          minute: newMinute,
          maxParticipants: 10,
        },
      ]);
    } else {
      setTimeSlots([
        {
          id: "",
          hour: "10",
          minute: "00",
          maxParticipants: 10,
        },
      ]);
    }
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
      const timeA = parseInt(a.hour + a.minute, 10);
      const timeB = parseInt(b.hour + b.minute, 10);
      return timeA - timeB;
    });

    setTimeSlots(updatedTimeSlots);
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
    return Array.from({ length: 19 }, (_, i) => (500 + i * 500).toString());
  };

  const hourOptions = generateHourOptions();
  const minuteOptions = generateMinuteOptions();
  const costOptions = generateCostOptions();

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
        maxParticipants,
        currentParticipants: 0,
        isActive: visibility,
      });

      if (errors) {
        console.error("Error updating event:", errors);
        return;
      }

      for (const slot of timeSlots) {
        const timeSlot = `${slot.hour}:${slot.minute}`;
        if (slot.id) {
          const { errors: timeSlotErrors } =
            await client.models.EventTimeSlot.update({
              id: slot.id,
              eventId: eventId,
              timeSlot,
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
              timeSlot,
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
          <Label htmlFor="date">日にち</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full">
                {date
                  ? format(date, "yyyy年M月d日(EEE)", { locale: ja })
                  : "日付を選択"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                classNames={{
                  root: "rounded-md border",
                }}
              />
            </PopoverContent>
          </Popover>
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
