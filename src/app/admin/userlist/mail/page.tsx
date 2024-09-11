"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

Amplify.configure(outputs);

const client = generateClient<Schema>();

export default function Component() {
  const router = useRouter();
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [users, setUsers] = useState<{ id: string; email: string }[]>([]);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const reservations = await client.models.Reservation.list();
        const uniqueUsers = Array.from(
          new Set(reservations.data.map((r) => r.email))
        ).map((email) => ({ id: email as string, email: email as string }));
        setUsers(uniqueUsers);
      } catch (error) {
        console.error("ユーザーの取得に失敗しました:", error);
      }
    }
    fetchUsers();
  }, []);

  const handleUserToggle = (userEmail: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userEmail)
        ? prev.filter((email) => email !== userEmail)
        : [...prev, userEmail]
    );
  };

  const handleSelectAll = () => {
    setSelectedUsers(users.map((user) => user.id));
  };

  const handleDeselectAll = () => {
    setSelectedUsers([]);
  };

  const handleSendEmails = () => {
    console.log(
      "送信先:",
      selectedUsers.map((id) => users.find((user) => user.id === id)?.email)
    );
    console.log("件名:", subject);
    console.log("本文:", content);
    // ここで実際のメール送信処理を行う

    // メール送信後、/adminに遷移
    router.push("/admin");
  };

  const handleGoBack = () => {
    router.back();
  };

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
                メール一斉送信
              </h1>
            </div>

            <div className="space-y-6">
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
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`user-${user.id}`}
                          checked={selectedUsers.includes(user.email)}
                          onCheckedChange={() => handleUserToggle(user.email)}
                        />
                        <Label
                          htmlFor={`user-${user.id}`}
                          className="flex-grow"
                        >
                          {user.email}
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

              <Button
                onClick={handleSendEmails}
                disabled={selectedUsers.length === 0 || !subject || !content}
                className="w-full"
              >
                <Send className="mr-2 h-4 w-4" />
                メールを送信 ({selectedUsers.length}人)
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
