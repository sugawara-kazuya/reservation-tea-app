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

export default function EditComponent({ params }: { params: { id: string } }) {
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
  const [eventId, setEventId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setIsLoading(true);
        const { data: event, errors: eventErrors } =
          await client.models.Event.get({ id: params.id });
        if (eventErrors) {
          throw new Error(
            "Error fetching event: " +
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
              "Error fetching time slots: " +
                timeSlotErrors.map((e) => e.message).join(", ")
            );
          }

          if (timeSlotsData) {
            const timeSlotItems = timeSlotsData as EventTimeSlot[];
            setTimeSlots(
              timeSlotItems.map((timeSlot) => ({
                hour: timeSlot.timeSlot.split(":")[0],
                minute: timeSlot.timeSlot.split(":")[1],
                maxParticipants: timeSlot.maxParticipants,
              }))
            );
          }
        }
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "An unknown error occurred"
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

  const handleCreate = async () => {
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

      // Update Event
      const { data: updatedEvent, errors: eventErrors } =
        await client.models.Event.update({
          id: eventId,
          title: teaPartyName,
          venue,
          date: formattedDate,
          cost: parseInt(cost, 10),
          description,
          imageUrl: imageUrl || undefined, // Only update if new image is uploaded
          maxParticipants,
          isActive: visibility,
        });

      if (eventErrors) {
        throw new Error(
          "Error updating event: " +
            eventErrors.map((e) => e.message).join(", ")
        );
      }

      // Fetch existing time slots
      const { data: existingTimeSlots, errors: fetchErrors } =
        await client.models.EventTimeSlot.list({
          filter: { eventId: { eq: eventId } },
        });

      if (fetchErrors) {
        throw new Error(
          "Error fetching existing time slots: " +
            fetchErrors.map((e) => e.message).join(", ")
        );
      }

      // Update or create time slots
      for (const slot of timeSlots) {
        const timeSlotString = `${slot.hour}:${slot.minute}`;
        const existingSlot = existingTimeSlots.find(
          (es) => es?.timeSlot === timeSlotString
        );

        if (existingSlot) {
          // Update existing slot
          const { errors: updateErrors } =
            await client.models.EventTimeSlot.update({
              id: existingSlot.id,
              maxParticipants: slot.maxParticipants,
            });

          if (updateErrors) {
            console.error("Error updating time slot:", updateErrors);
          }
        } else {
          // Create new slot
          const { errors: createErrors } =
            await client.models.EventTimeSlot.create({
              eventId: eventId,
              timeSlot: timeSlotString,
              maxParticipants: slot.maxParticipants,
              currentParticipants: 0,
            });

          if (createErrors) {
            console.error("Error creating time slot:", createErrors);
          }
        }
      }

      // Delete removed slots
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
              console.error("Error deleting time slot:", deleteErrors);
            }
          }
        }
      }

      console.log("Event and time slots updated successfully");
      router.push("/admin");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update event or time slots"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center mb-6">
        <ArrowLeftIcon
          className="w-6 h-6 cursor-pointer"
          onClick={() => window.history.back()}
        />
        <h1 className="text-xl font-bold ml-2">お茶会編集</h1>
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
          onClick={handleCreate}
          disabled={isLoading}
        >
          {isLoading ? "更新中..." : "編集完了"}
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
