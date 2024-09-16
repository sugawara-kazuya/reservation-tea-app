"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Send, Users } from "lucide-react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify";
import { Amplify } from "aws-amplify";
import outputs from "@/output";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { fetchAuthSession } from "aws-amplify/auth";

Amplify.configure(outputs);

const client = generateClient<Schema>();

async function sendBulkEmails(
  toAddresses: string[],
  subject: string,
  content: string
) {
  const { credentials } = await fetchAuthSession();
  const sesClient = new SESClient({
    credentials: credentials,
    region: "ap-northeast-1",
  });

  const senderEmail = "kz515yssg@gmail.com";

  const params = {
    Destination: {
      BccAddresses: toAddresses,
    },
    Message: {
      Body: {
        Text: {
          Charset: "UTF-8",
          Data: content,
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: subject,
      },
    },
    Source: senderEmail,
  };

  try {
    const command = new SendEmailCommand(params);
    const response = await sesClient.send(command);
    console.log("Emails sent successfully:", response.MessageId);
    return response.MessageId;
  } catch (error) {
    console.error("Error sending emails:", error);
    throw error;
  }
}

export default function Component() {
  const router = useRouter();
  const params = useParams();
  const eventId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [event, setEvent] = useState<Schema["Event"]["type"] | null>(null);
  const [reservations, setReservations] = useState<
    Schema["Reservation"]["type"][]
  >([]);
  const [isSending, setIsSending] = useState(false);
  const [sendingResult, setSendingResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEventAndReservations() {
      if (!eventId) {
        setError("イベントIDが指定されていません。");
        return;
      }

      try {
        // イベント情報の取得
        const eventData = await client.models.Event.get({ id: eventId });
        if (!eventData.data) {
          setError("指定されたイベントが見つかりません。");
          return;
        }
        setEvent(eventData.data);

        // 予約情報の取得
        const reservationData = await client.models.Reservation.list({
          filter: { eventId: { eq: eventId } },
        });
        setReservations(reservationData.data);
      } catch (error) {
        console.error("データの取得に失敗しました:", error);
        setError("データの取得中にエラーが発生しました。");
      }
    }

    fetchEventAndReservations();
  }, [eventId]);

  const handleUserToggle = (userEmail: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userEmail)
        ? prev.filter((email) => email !== userEmail)
        : [...prev, userEmail]
    );
  };

  const handleSelectAll = () => {
    setSelectedUsers(
      reservations.map((reservation) => reservation.email ?? "").filter(Boolean)
    );
  };

  const handleDeselectAll = () => {
    setSelectedUsers([]);
  };

  const handleSendEmails = async () => {
    setIsSending(true);
    setSendingResult(null);
    try {
      const toAddresses = selectedUsers.filter(
        (email): email is string => email !== undefined
      );
      await sendBulkEmails(toAddresses, subject, content);
      setSendingResult("メールの送信に成功しました。");
      setTimeout(() => router.push("/admin"), 2000);
    } catch (error) {
      console.error("メール送信中にエラーが発生しました:", error);
      setSendingResult("メールの送信に失敗しました。");
    } finally {
      setIsSending(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">エラー</h1>
          <p>{error}</p>
          <Button onClick={handleGoBack} className="mt-4">
            戻る
          </Button>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-2xl font-bold">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center mb-6">
              <Button
                variant="outline"
                size="sm"
                className="mr-4"
                onClick={handleGoBack}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                戻る
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">
                イベント予約者へのメール送信
              </h1>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-md">
                <h2 className="text-xl font-semibold mb-2">{event.title}</h2>
                <p>
                  <strong>日付:</strong> {event.date}
                </p>
                <p>
                  <strong>会場:</strong> {event.venue}
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="mr-2 h-5 w-5" />
                    送信先ユーザー
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between mb-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                    >
                      全て選択
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeselectAll}
                    >
                      全て解除
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-2">
                    {reservations.map((reservation) => (
                      <div
                        key={reservation.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`user-${reservation.id}`}
                          checked={selectedUsers.includes(
                            reservation.email ?? ""
                          )}
                          onCheckedChange={() =>
                            handleUserToggle(reservation.email ?? "")
                          }
                        />
                        <Label
                          htmlFor={`user-${reservation.id}`}
                          className="flex-grow"
                        >
                          {reservation.email}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label htmlFor="subject">件名</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="メールの件名を入力してください"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">本文</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="メールの本文を入力してください"
                  rows={10}
                />
              </div>

              {sendingResult && (
                <div
                  className={`p-2 rounded ${sendingResult.includes("成功") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                >
                  {sendingResult}
                </div>
              )}

              <Button
                onClick={handleSendEmails}
                disabled={
                  selectedUsers.length === 0 ||
                  !subject ||
                  !content ||
                  isSending
                }
                className="w-full"
              >
                {isSending ? (
                  "送信中..."
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    メールを送信 ({selectedUsers.length}人)
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
