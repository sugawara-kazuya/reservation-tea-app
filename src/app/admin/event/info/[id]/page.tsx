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
  Mail,
  ChevronUp,
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
  const [openReservations, setOpenReservations] = useState<
    Record<string, boolean>
  >({});
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
      console.log(reservationsData);
      setReservations(reservationsData);
    } catch (error) {
      console.error("Error fetching event data:", error);
      setError(`データの取得中にエラーが発生しました: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleTimeSlot = (timeSlot: string, isOpen?: boolean) => {
    const newState = isOpen !== undefined ? isOpen : !openTimeSlots[timeSlot];
    setOpenTimeSlots((prev) => ({
      ...prev,
      [timeSlot]: newState,
    }));

    const timeSlotReservations = reservations.filter(
      (r) => r.reservationTime === timeSlot
    );

    setOpenReservations((prev) => {
      const newOpenReservations = { ...prev };
      timeSlotReservations.forEach((reservation) => {
        newOpenReservations[reservation.id ?? ""] = newState;
      });
      return newOpenReservations;
    });
  };

  const toggleAllTimeSlots = (isOpen: boolean) => {
    const newOpenTimeSlots: Record<string, boolean> = {};
    timeSlots.forEach((timeSlot) => {
      newOpenTimeSlots[timeSlot.timeSlot ?? ""] = isOpen;
    });
    setOpenTimeSlots(newOpenTimeSlots);

    const newOpenReservations: Record<string, boolean> = {};
    reservations.forEach((reservation) => {
      newOpenReservations[reservation.id ?? ""] = isOpen;
    });
    setOpenReservations(newOpenReservations);
  };

  const toggleReservation = (reservationId: string) => {
    setOpenReservations((prev) => ({
      ...prev,
      [reservationId]: !prev[reservationId],
    }));
  };

  const handleGoBack = () => {
    router.push("/admin/event");
  };

  const handleEdit = (reservationId: string | null | undefined) => {
    if (reservationId) {
      router.push(`/admin/event/info/user/${reservationId}`);
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
        // 予約情報を取得
        const { data: reservationData, errors: fetchErrors } =
          await client.models.Reservation.get({ id: reservationToDelete });
        if (fetchErrors) throw new Error(JSON.stringify(fetchErrors));
        if (!reservationData) throw new Error("予約が見つかりません。");

        // 予約を削除
        const { errors: deleteErrors } = await client.models.Reservation.delete(
          {
            id: reservationToDelete,
          }
        );
        if (deleteErrors) throw new Error(JSON.stringify(deleteErrors));

        // Eventの参加者数を更新
        if (event) {
          const updatedParticipants =
            (event.currentParticipants || 0) -
            (reservationData.participants || 0);
          const { errors: eventUpdateErrors } =
            await client.models.Event.update({
              id: event.id,
              currentParticipants:
                updatedParticipants >= 0 ? updatedParticipants : 0,
            });
          if (eventUpdateErrors)
            throw new Error(JSON.stringify(eventUpdateErrors));
        }

        // EventTimeSlotの参加者数を更新
        const timeSlot = timeSlots.find(
          (ts) => ts.timeSlot === reservationData.reservationTime
        );
        if (timeSlot) {
          const updatedParticipants =
            (timeSlot.currentParticipants || 0) -
            (reservationData.participants || 0);
          const { errors: timeSlotUpdateErrors } =
            await client.models.EventTimeSlot.update({
              id: timeSlot.id,
              currentParticipants:
                updatedParticipants >= 0 ? updatedParticipants : 0,
            });
          if (timeSlotUpdateErrors)
            throw new Error(JSON.stringify(timeSlotUpdateErrors));
        }

        setDeleteConfirmOpen(false);
        setReservationToDelete(null);

        // データを再取得して画面を更新
        await fetchEventData();
      } catch (error) {
        console.error("Error during reservation deletion process:", error);
        setError(`予約の削除処理中にエラーが発生しました: ${error}`);
      }
    }
  };

  const handleCreateReservation = () => {
    router.push(`/admin/event/info/add/${id}`);
  };

  const handleBulkEmail = () => {
    router.push(`/admin/event/info/mail/${id}`);
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
        <div className="flex space-x-2">
          <Button onClick={handleBulkEmail} className="whitespace-nowrap">
            <Mail className="mr-2 h-4 w-4" /> メール一斉送信
          </Button>
          <Button
            onClick={handleCreateReservation}
            className="whitespace-nowrap"
          >
            <Plus className="mr-2 h-4 w-4" /> 新規予約
          </Button>
        </div>
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
          <div className="flex justify-between items-center">
            <CardTitle className="font-serif text-lg md:text-xl">
              予約一覧
            </CardTitle>
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => toggleAllTimeSlots(true)}
                className="bg-white text-green-800 hover:bg-green-100"
              >
                <ChevronDown className="mr-2 h-4 w-4" />
                全部開く
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => toggleAllTimeSlots(false)}
                className="bg-white text-green-800 hover:bg-green-100"
              >
                <ChevronUp className="mr-2 h-4 w-4" />
                全部閉じる
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {timeSlots.length === 0 ? (
            <p className="mt-4">時間枠が設定されていません。</p>
          ) : (
            <div className="mt-4 space-y-4">
              {timeSlots.map((timeSlot) => {
                const slotReservations = reservations
                  .filter((r) => r.reservationTime === timeSlot.id)
                  .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
                console.log(slotReservations);
                return (
                  <Collapsible
                    key={timeSlot.id}
                    className="mb-4"
                    open={openTimeSlots[timeSlot.timeSlot ?? ""]}
                    onOpenChange={() => toggleTimeSlot(timeSlot.timeSlot ?? "")}
                  >
                    <CollapsibleTrigger className="flex justify-between items-center w-full p-3 bg-green-100 rounded-lg transition-colors hover:bg-green-200">
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
                              <TableHead className="w-1/3 text-right">
                                操作
                              </TableHead>
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
                                <React.Fragment key={reservation.id}>
                                  <TableRow
                                    onClick={() =>
                                      toggleReservation(reservation.id ?? "")
                                    }
                                    className={`cursor-pointer ${
                                      openReservations[reservation.id ?? ""]
                                        ? "bg-gray-100"
                                        : ""
                                    }`}
                                  >
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
                                      <div className="flex items-center justify-end space-x-1">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEdit(reservation.id);
                                          }}
                                          className="p-1"
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(reservation.id);
                                          }}
                                          className="p-1"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleReservation(
                                              reservation.id ?? ""
                                            );
                                          }}
                                          className="p-0"
                                        >
                                          <ChevronDown
                                            className={`h-4 w-4 transition-transform ${
                                              openReservations[
                                                reservation.id ?? ""
                                              ]
                                                ? "rotate-180"
                                                : ""
                                            }`}
                                          />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                  {openReservations[reservation.id ?? ""] && (
                                    <TableRow>
                                      <TableCell colSpan={3} className="py-2">
                                        <div className="space-y-1 pl-4">
                                          {reservation.accompaniedGuest1 && (
                                            <div>
                                              <strong>同行者1:</strong>{" "}
                                              {reservation.accompaniedGuest1}
                                            </div>
                                          )}
                                          {reservation.accompaniedGuest2 && (
                                            <div>
                                              <strong>同行者2:</strong>{" "}
                                              {reservation.accompaniedGuest2}
                                            </div>
                                          )}
                                          {reservation.accompaniedGuest3 && (
                                            <div>
                                              <strong>同行者3:</strong>{" "}
                                              {reservation.accompaniedGuest3}
                                            </div>
                                          )}
                                          {reservation.accompaniedGuest4 && (
                                            <div>
                                              <strong>同行者4:</strong>{" "}
                                              {reservation.accompaniedGuest4}
                                            </div>
                                          )}
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </React.Fragment>
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
