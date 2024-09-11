"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Mails } from "lucide-react";
import { useRouter } from "next/navigation";
import { Amplify } from "aws-amplify";
import outputs from "@/output";

Amplify.configure(outputs);
const client = generateClient<Schema>();

export default function Component() {
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: reservations } = await client.models.Reservation.list();
      const userMap = new Map();
      reservations.forEach((reservation) => {
        if (!userMap.has(reservation.email)) {
          userMap.set(reservation.email, {
            name: reservation.name,
            email: reservation.email,
            phone: reservation.phone,
            reservationCount: 1,
            totalSpent: reservation.totalCost,
          });
        } else {
          const user = userMap.get(reservation.email);
          user.reservationCount++;
          user.totalSpent += reservation.totalCost;
        }
      });
      setUsers(Array.from(userMap.values()));
    } catch (error) {
      console.error("ユーザーの取得に失敗しました:", error);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGoBack = () => {
    router.back();
  };

  const handleSendEmail = (email: string) => {
    console.log(`${email}にメールを送信します`);
  };

  const handleBulkSendEmail = () => {
    router.push("/admin/userlist/mail");
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGoBack}
            className="mr-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            戻る
          </Button>
          <h1 className="text-2xl font-bold">ユーザー一覧</h1>
        </div>
        <Button onClick={handleBulkSendEmail}>
          <Mails className="mr-2 h-4 w-4" />
          一斉メール送信
        </Button>
      </div>
      <Input
        type="text"
        placeholder="名前またはメールアドレスで検索"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>名前</TableHead>
            <TableHead>メールアドレス</TableHead>
            <TableHead>電話番号</TableHead>
            <TableHead>予約回数</TableHead>
            <TableHead>総利用金額</TableHead>
            <TableHead>アクション</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredUsers.map((user) => (
            <TableRow key={user.email}>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.phone}</TableCell>
              <TableCell>{user.reservationCount}回</TableCell>
              <TableCell>{user.totalSpent.toLocaleString()}円</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => alert(`${user.name}の詳細を表示`)}
                  >
                    詳細
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendEmail(user.email)}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    メール送信
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
