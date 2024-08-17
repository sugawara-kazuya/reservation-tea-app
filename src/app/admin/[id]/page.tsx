"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type TimeSlot = {
  startTime: string;
  duration: string;
};

export default function Component() {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    { startTime: "10:00", duration: "10" },
  ]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleAddTimeSlot = () => {
    setTimeSlots([...timeSlots, { startTime: "", duration: "" }]);
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
      i === index ? { ...slot, [field]: value } : slot
    );
    setTimeSlots(updatedTimeSlots);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center mb-6">
        <ArrowLeftIcon
          className="w-6 h-6 cursor-pointer"
          onClick={() => window.history.back()}
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
            placeholder="七夕茶会"
            defaultValue="七夕茶会"
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="visibility">表示・非表示</Label>
          <Switch id="visibility" defaultChecked />
        </div>
        <div>
          <Label htmlFor="venue">会場</Label>
          <Input id="venue" placeholder="紅葉園" defaultValue="紅葉園" />
        </div>
        <div>
          <Label htmlFor="cost">一人当たりの参加費用</Label>
          <Input id="cost" placeholder="1000" defaultValue="1000" />
        </div>
        <div>
          <Label htmlFor="max-participants">最大参加人数</Label>
          <Input id="max-participants" placeholder="60" defaultValue="60" />
        </div>
        <div>
          <Label htmlFor="current-participants">現在の参加人数</Label>
          <Input id="current-participants" placeholder="0" defaultValue="0" />
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
          <Input
            id="date"
            placeholder="2024年7月30日"
            defaultValue="2024年7月30日"
          />
        </div>
        <div>
          <Label>時間の管理</Label>
          <div className="space-y-2">
            {timeSlots.map((slot, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  placeholder="10:00"
                  value={slot.startTime}
                  onChange={(e) =>
                    handleChangeTimeSlot(index, "startTime", e.target.value)
                  }
                  className="w-1/3"
                />
                <Input
                  placeholder="10"
                  value={slot.duration}
                  onChange={(e) =>
                    handleChangeTimeSlot(index, "duration", e.target.value)
                  }
                  className="w-1/3"
                />
                <Button
                  variant="outline"
                  className="w-10 h-10"
                  onClick={() => handleRemoveTimeSlot(index)}
                >
                  <MinusIcon className="w-10 h-10" /> {/* アイコンを大きく */}
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
            placeholder="各席8〜12名（45分）どなたでも参加いただけます。（服装自由）"
            defaultValue="各席8〜12名（45分）どなたでも参加いただけます。（服装自由）"
            className="min-h-[100px]"
          />
        </div>
        <Button className="w-full bg-green-500 text-white">編集完了</Button>
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
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
    </svg>
  );
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
