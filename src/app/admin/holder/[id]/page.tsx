"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { generateClient } from "aws-amplify/data";
import { type Schema } from "@/amplify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronDown,
  Clock,
  CalendarDays,
  Users,
  MapPin,
  JapaneseYen,
  Edit,
  Trash2,
  Plus,
  ArrowLeft,
} from "lucide-react";
import { Amplify } from "aws-amplify";
import outputs from "@/output";

Amplify.configure(outputs);

const client = generateClient<Schema>();

const EventDetails: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [event, setEvent] = useState<Schema["Event"]["type"] | null>(null);
  const [timeSlots, setTimeSlots] = useState<Schema["EventTimeSlot"]["type"][]>(
    []
  );
  const [reservations, setReservations] = useState<
    Schema["Reservation"]["type"][]
  >([]);
  const [openTimeSlots, setOpenTimeSlots] = useState<Record<string, boolean>>(
    {}
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [reservationToDelete, setReservationToDelete] = useState<string | null>(
    null
  );

  useEffect(() => {
    fetchEventData();
  }, [id]);

  const fetchEventData = async () => {
    if (!id) {
      setError("有効なイベントIDが指定されていません。");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: eventData, errors: eventErrors } =
        await client.models.Event.get({ id });
      if (eventErrors) throw new Error(JSON.stringify(eventErrors));
      if (!eventData) throw new Error("イベントが見つかりません。");
      setEvent(eventData);

      const { data: timeSlotsData, errors: timeSlotErrors } =
        await client.models.EventTimeSlot.list({
          filter: { eventId: { eq: id } },
        });
      if (timeSlotErrors) throw new Error(JSON.stringify(timeSlotErrors));
      setTimeSlots(
        timeSlotsData.sort((a, b) =>
          (a.timeSlot ?? "").localeCompare(b.timeSlot ?? "")
        )
      );

      const { data: reservationsData, errors: reservationErrors } =
        await client.models.Reservation.list({
          filter: { eventId: { eq: id } },
        });
      if (reservationErrors) throw new Error(JSON.stringify(reservationErrors));
      setReservations(reservationsData);
    } catch (error) {
      console.error("Error fetching event data:", error);
      setError(`データの取得中にエラーが発生しました: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleTimeSlot = (timeSlot: string) => {
    setOpenTimeSlots((prev) => ({
      ...prev,
      [timeSlot]: !prev[timeSlot],
    }));
  };

  const handleGoBack = () => {
    router.push("/admin");
  };

  const handleEdit = (reservationId: string | null | undefined) => {
    if (reservationId) {
      router.push(`/admin/user/${reservationId}`);
    } else {
      console.error("Invalid reservation ID");
    }
  };

  const handleDelete = (reservationId: string | null | undefined) => {
    if (reservationId) {
      setReservationToDelete(reservationId);
      setDeleteConfirmOpen(true);
    } else {
      console.error("Invalid reservation ID");
    }
  };

  const confirmDelete = async () => {
    if (reservationToDelete) {
      try {
        const { errors } = await client.models.Reservation.delete({
          id: reservationToDelete,
        });
        if (errors) {
          throw new Error(JSON.stringify(errors));
        }
        setDeleteConfirmOpen(false);
        setReservationToDelete(null);
        // 予約を削除した後、データを再取得して画面を更新
        await fetchEventData();
      } catch (error) {
        console.error("Error deleting reservation:", error);
        setError(`予約の削除中にエラーが発生しました: ${error}`);
      }
    }
  };

  const handleCreateReservation = () => {
    router.push(`/admin/user/add/${id}`);
  };

  if (loading) {
    return <div>データを読み込んでいます...</div>;
  }

  if (error) {
    return <div>エラー: {error}</div>;
  }

  if (!event) {
    return <div>イベントが見つかりません。</div>;
  }

  return (
    <div className="container mx-auto py-6 px-4 bg-stone-50">
      <div className="flex justify-between items-center mb-6">
        <Button variant="ghost" onClick={handleGoBack} className="p-2">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <Button onClick={handleCreateReservation} className="whitespace-nowrap">
          <Plus className="mr-2 h-4 w-4" /> 新規予約
        </Button>
      </div>

      <Card className="mb-6 border-2 border-green-800">
        <CardHeader className="bg-green-800 text-white">
          <div className="flex justify-between items-center flex-wrap">
            <CardTitle className="text-xl md:text-2xl font-serif mb-2 md:mb-0">
              {event.title}
            </CardTitle>
            {event.isActive ? (
              <Badge className="bg-green-500 text-white">開催中</Badge>
            ) : (
              <Badge variant="secondary">終了</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <CalendarDays className="w-5 h-5 text-green-800 flex-shrink-0" />
              <span className="text-sm">{event.date}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-green-800 flex-shrink-0" />
              <span className="text-sm">{event.venue}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-800 flex-shrink-0" />
              <span className="text-sm">
                定員 {event.currentParticipants}/{event.maxParticipants}名
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <JapaneseYen className="w-5 h-5 text-green-800 flex-shrink-0" />
              <span className="text-sm">{event.cost?.toLocaleString()}円</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {event.description}
          </p>
        </CardContent>
      </Card>

      <Card className="border-2 border-green-800">
        <CardHeader className="bg-green-800 text-white">
          <CardTitle className="font-serif text-lg md:text-xl">
            時間帯別ご予約一覧
          </CardTitle>
        </CardHeader>
        <CardContent>
          {timeSlots.length === 0 ? (
            <p className="mt-4">時間枠が設定されていません。</p>
          ) : (
            <div className="mt-4 space-y-4">
              {timeSlots.map((timeSlot) => {
                const slotReservations = reservations
                  .filter((r) => r.reservationTime === timeSlot.timeSlot)
                  .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
                return (
                  <Collapsible
                    key={timeSlot.id}
                    className="mb-4"
                    open={openTimeSlots[timeSlot.timeSlot ?? ""]}
                    onOpenChange={() => toggleTimeSlot(timeSlot.timeSlot ?? "")}
                  >
                    <CollapsibleTrigger className="flex justify-between items-center w-full p-3 bg-green-100 rounded-lg hover:bg-green-200 transition-colors">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-green-800" />
                        <span className="font-semibold text-sm">
                          {timeSlot.timeSlot}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant="secondary"
                          className="bg-green-200 text-green-800 text-xs"
                        >
                          {timeSlot.currentParticipants}/
                          {timeSlot.maxParticipants}名
                        </Badge>
                        <ChevronDown
                          className={`w-4 h-4 text-green-800 transition-transform duration-200 ${
                            openTimeSlots[timeSlot.timeSlot ?? ""]
                              ? "rotate-180"
                              : ""
                          }`}
                        />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-1/3">名前</TableHead>
                              <TableHead className="w-1/3">人数</TableHead>
                              <TableHead className="w-1/3">操作</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {slotReservations.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={3} className="text-center">
                                  予約がありません。
                                </TableCell>
                              </TableRow>
                            ) : (
                              slotReservations.map((reservation) => (
                                <TableRow key={reservation.id}>
                                  <TableCell className="py-2">
                                    <div className="font-medium truncate">
                                      {reservation.name}
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-2">
                                    <div className="text-sm">
                                      {reservation.participants}名
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-2">
                                    <div className="flex space-x-1">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          handleEdit(reservation.id)
                                        }
                                        className="p-1"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          handleDelete(reservation.id)
                                        }
                                        className="p-1"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>予約の削除確認</DialogTitle>
            <DialogDescription>
              この予約を削除してもよろしいですか？この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              キャンセル
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventDetails;
