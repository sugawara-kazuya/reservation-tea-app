"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Clock,
  CalendarDays,
  Users,
  MapPin,
  JapaneseYen,
  Pencil,
  ArrowLeft,
} from "lucide-react";

// イベントデータの型定義
interface EventData {
  id: number;
  title: string;
  venue: string;
  date: string;
  cost: number;
  description: string;
  maxParticipants: number;
  isActive: boolean;
}

// 予約データの型定義
interface Reservation {
  id: number;
  name: string;
  email: string;
  reservationTime: string;
  participants: number;
  memo: string;
}

// イベントデータ（実際のアプリケーションではAPIから取得します）
const eventData: EventData = {
  id: 1,
  title: "七夕茶会",
  venue: "紅葉園",
  date: "2023年7月7日(日)",
  cost: 5000,
  description:
    "新緑の美しい季節に、清々しい抹茶と季節の和菓子をお楽しみいただきます。茶道の作法を学びながら、日本の伝統文化に触れる特別な時間をお過ごしください。",
  maxParticipants: 20,
  isActive: true,
};

// 予約データを生成する関数（実際のアプリケーションではAPIから取得します）
const generateReservations = (): Reservation[] => {
  const timeSlots = ["10:00", "11:00", "13:00", "14:00", "15:00"];
  const reservations: Reservation[] = [];
  timeSlots.forEach((slot) => {
    const participantsCount = Math.floor(Math.random() * 3) + 1;
    reservations.push({
      id: reservations.length + 1,
      name: `お客様${reservations.length + 1}`,
      email: `guest${reservations.length + 1}@example.com`,
      reservationTime: slot,
      participants: participantsCount,
      memo: "",
    });
  });
  return reservations;
};

export default function Component() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [editingReservation, setEditingReservation] =
    useState<Reservation | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  useEffect(() => {
    setReservations(generateReservations());
  }, []);

  const handleAddReservation = () => {
    setEditingReservation({
      id: reservations.length + 1,
      name: "",
      email: "",
      reservationTime: "10:00",
      participants: 1,
      memo: "",
    });
    setIsAddModalOpen(true);
  };

  const handleSave = () => {
    if (editingReservation) {
      if (reservations.find((r) => r.id === editingReservation.id)) {
        setReservations(
          reservations.map((r) =>
            r.id === editingReservation.id ? editingReservation : r
          )
        );
      } else {
        setReservations([...reservations, editingReservation]);
      }
      setEditingReservation(null);
      setIsAddModalOpen(false);
    }
  };

  const groupedReservations = reservations.reduce<
    Record<string, Reservation[]>
  >((groups, reservation) => {
    if (!groups[reservation.reservationTime]) {
      groups[reservation.reservationTime] = [];
    }
    groups[reservation.reservationTime].push(reservation);
    return groups;
  }, {});

  return (
    <div className="container mx-auto py-10 px-4 bg-stone-50">
      <div className="mb-6 flex items-center">
        <button
          onClick={() => router.back()} // 戻るボタンの動作
          className="flex items-center space-x-2 text-green-800 hover:text-green-600"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>戻る</span>
        </button>
      </div>

      <Card className="mb-6 border-2 border-green-800">
        <CardHeader className="bg-green-800 text-white">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-serif">
              {eventData.title}
            </CardTitle>
            {eventData.isActive ? (
              <Badge className="bg-green-500 text-white">開催中</Badge>
            ) : (
              <Badge variant="secondary">終了</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <CalendarDays className="w-5 h-5 text-green-800" />
              <span>{eventData.date}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-green-800" />
              <span>{eventData.venue}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-800" />
              <span>定員 {eventData.maxParticipants}名様</span>
            </div>
            <div className="flex items-center space-x-2">
              <JapaneseYen className="w-5 h-5 text-green-800" />
              <span>{eventData.cost.toLocaleString()}円</span>
            </div>
          </div>
          <p className="text-muted-foreground mb-4">{eventData.description}</p>
        </CardContent>
      </Card>

      <Card className="mb-6 border-2 border-green-800">
        <CardHeader className="bg-green-800 text-white">
          <CardTitle className="font-serif">ご予約状況</CardTitle>
        </CardHeader>
        <CardContent className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <Users className="w-6 h-6 text-green-800" />
              <span className="text-2xl font-bold">
                {reservations.reduce((sum, r) => sum + r.participants, 0)}名様
              </span>
              <span className="text-muted-foreground">ご来席予定</span>
            </div>
            <div className="flex items-center space-x-2">
              <JapaneseYen className="w-6 h-6 text-green-800" />
              <span className="text-2xl font-bold">
                {reservations.reduce((sum, r) => sum + r.participants, 0) *
                  eventData.cost}
                円
              </span>
              <span className="text-muted-foreground">総御料金</span>
            </div>
          </div>
          <div className="mb-2">
            <h3 className="font-semibold mb-2">参加状況</h3>
            <Progress
              value={
                (reservations.reduce((sum, r) => sum + r.participants, 0) /
                  eventData.maxParticipants) *
                100
              }
              className="h-2"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            あと
            {eventData.maxParticipants -
              reservations.reduce((sum, r) => sum + r.participants, 0)}
            名様ご予約いただけます
          </p>
        </CardContent>
      </Card>

      <Card className="border-2 border-green-800">
        <CardHeader className="bg-green-800 text-white">
          <CardTitle className="font-serif">時間帯別ご予約一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mt-8 mb-8 flex items-center space-x-4">
            <Input
              placeholder="お客様のお名前またはメールアドレスで検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border-green-800"
            />
            <Button
              variant="outline"
              className="bg-green-800 text-white hover:bg-green-600"
              onClick={handleAddReservation}
            >
              予約追加
            </Button>
          </div>
          {Object.entries(groupedReservations)
            .sort()
            .map(([timeSlot, slotReservations]) => (
              <Collapsible key={timeSlot} className="mb-4">
                <CollapsibleTrigger className="flex justify-between items-center w-full p-4 bg-green-100 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-green-800" />
                    <span className="font-semibold">{timeSlot}</span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-green-200 text-green-800"
                  >
                    {slotReservations.reduce(
                      (sum, r) => sum + r.participants,
                      0
                    )}
                    /{4 * slotReservations.length}名様
                  </Badge>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="overflow-x-auto">
                    <Table className="min-w-[600px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>お客様</TableHead>
                          <TableHead>メールアドレス</TableHead>
                          <TableHead>参加人数</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {slotReservations.map((reservation) => (
                          <Dialog
                            key={reservation.id}
                            open={editingReservation?.id === reservation.id}
                            onOpenChange={(open) =>
                              setEditingReservation(open ? reservation : null)
                            }
                          >
                            <TableRow
                              className="cursor-pointer hover:bg-green-50"
                              onClick={() =>
                                setEditingReservation({ ...reservation })
                              }
                            >
                              <TableCell className="whitespace-normal break-words">
                                {reservation.name}
                              </TableCell>
                              <TableCell className="whitespace-normal break-words">
                                {reservation.email}
                              </TableCell>
                              <TableCell>
                                {reservation.participants}名様
                              </TableCell>
                            </TableRow>
                            <DialogContent className="sm:max-w-[600px]">
                              <DialogHeader>
                                <DialogTitle>予約情報の編集</DialogTitle>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="name" className="text-right">
                                    お名前
                                  </Label>
                                  <Input
                                    id="name"
                                    value={editingReservation?.name || ""}
                                    onChange={(e) =>
                                      setEditingReservation({
                                        ...editingReservation!,
                                        name: e.target.value,
                                      })
                                    }
                                    className="col-span-3"
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="email" className="text-right">
                                    メールアドレス
                                  </Label>
                                  <Input
                                    id="email"
                                    value={editingReservation?.email || ""}
                                    onChange={(e) =>
                                      setEditingReservation({
                                        ...editingReservation!,
                                        email: e.target.value,
                                      })
                                    }
                                    className="col-span-3"
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label
                                    htmlFor="reservationTime"
                                    className="text-right"
                                  >
                                    予約時間
                                  </Label>
                                  <Select
                                    value={editingReservation?.reservationTime}
                                    onValueChange={(value) =>
                                      setEditingReservation({
                                        ...editingReservation!,
                                        reservationTime: value,
                                      })
                                    }
                                  >
                                    <SelectTrigger className="col-span-3">
                                      <SelectValue placeholder="予約時間を選択" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="10:00">
                                        10:00
                                      </SelectItem>
                                      <SelectItem value="11:00">
                                        11:00
                                      </SelectItem>
                                      <SelectItem value="13:00">
                                        13:00
                                      </SelectItem>
                                      <SelectItem value="14:00">
                                        14:00
                                      </SelectItem>
                                      <SelectItem value="15:00">
                                        15:00
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label
                                    htmlFor="participants"
                                    className="text-right"
                                  >
                                    参加人数
                                  </Label>
                                  <Select
                                    value={editingReservation?.participants.toString()}
                                    onValueChange={(value) =>
                                      setEditingReservation({
                                        ...editingReservation!,
                                        participants: parseInt(value),
                                      })
                                    }
                                  >
                                    <SelectTrigger className="col-span-3">
                                      <SelectValue placeholder="参加人数を選択" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="1">1名様</SelectItem>
                                      <SelectItem value="2">2名様</SelectItem>
                                      <SelectItem value="3">3名様</SelectItem>
                                      <SelectItem value="4">4名様</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="memo" className="text-right">
                                    メモ
                                  </Label>
                                  <Textarea
                                    id="memo"
                                    value={editingReservation?.memo || ""}
                                    onChange={(e) =>
                                      setEditingReservation({
                                        ...editingReservation!,
                                        memo: e.target.value,
                                      })
                                    }
                                    className="col-span-3"
                                    placeholder="特記事項があればご記入ください"
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button type="submit" onClick={handleSave}>
                                  保存
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
        </CardContent>
      </Card>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>予約の追加</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                お名前
              </Label>
              <Input
                id="name"
                value={editingReservation?.name || ""}
                onChange={(e) =>
                  setEditingReservation({
                    ...editingReservation!,
                    name: e.target.value,
                  })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                メールアドレス
              </Label>
              <Input
                id="email"
                value={editingReservation?.email || ""}
                onChange={(e) =>
                  setEditingReservation({
                    ...editingReservation!,
                    email: e.target.value,
                  })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reservationTime" className="text-right">
                予約時間
              </Label>
              <Select
                value={editingReservation?.reservationTime}
                onValueChange={(value) =>
                  setEditingReservation({
                    ...editingReservation!,
                    reservationTime: value,
                  })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="予約時間を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10:00">10:00</SelectItem>
                  <SelectItem value="11:00">11:00</SelectItem>
                  <SelectItem value="13:00">13:00</SelectItem>
                  <SelectItem value="14:00">14:00</SelectItem>
                  <SelectItem value="15:00">15:00</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="participants" className="text-right">
                参加人数
              </Label>
              <Select
                value={editingReservation?.participants.toString()}
                onValueChange={(value) =>
                  setEditingReservation({
                    ...editingReservation!,
                    participants: parseInt(value),
                  })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="参加人数を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1名様</SelectItem>
                  <SelectItem value="2">2名様</SelectItem>
                  <SelectItem value="3">3名様</SelectItem>
                  <SelectItem value="4">4名様</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="memo" className="text-right">
                メモ
              </Label>
              <Textarea
                id="memo"
                value={editingReservation?.memo || ""}
                onChange={(e) =>
                  setEditingReservation({
                    ...editingReservation!,
                    memo: e.target.value,
                  })
                }
                className="col-span-3"
                placeholder="特記事項があればご記入ください"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleSave}>
              追加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
