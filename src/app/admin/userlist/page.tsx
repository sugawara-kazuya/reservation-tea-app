"use client";

import React, { useState, useEffect } from "react";
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
import { ArrowLeft, Mails } from "lucide-react";
import { useRouter } from "next/navigation";
import { Amplify } from "aws-amplify";
import outputs from "@/output";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

Amplify.configure(outputs);
const client = generateClient<Schema>();

interface User {
  name: string;
  email: string;
  phone: string;
  reservationCount: number;
  totalSpent: number;
}

const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async (): Promise<void> => {
    try {
      const { data: reservations, errors } =
        await client.models.Reservation.list();
      if (errors) {
        throw new Error(errors.map((e) => e.message).join(", "));
      }
      const userMap = new Map<string, User>();
      reservations.forEach((reservation) => {
        if (!reservation) return; // Skip if reservation is null or undefined
        if (!userMap.has(reservation.email ?? "")) {
          userMap.set(reservation.email ?? "", {
            name: reservation.name ?? "", // reservation.name が null の場合、空文字列を代入
            email: reservation.email ?? "",
            phone: reservation.phone ?? "",
            reservationCount: 1,
            totalSpent: reservation.totalCost || 0,
          });
        } else {
          const user = userMap.get(reservation.email ?? "")!;
          user.reservationCount++;
          user.totalSpent += reservation.totalCost || 0;
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

  const handleGoBack = (): void => {
    router.back();
  };

  const handleBulkSendEmail = (): void => {
    router.push("/admin/userlist/mail");
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
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
          <h1 className="text-xl sm:text-2xl font-bold">ユーザー一覧</h1>
        </div>
        <Button onClick={handleBulkSendEmail} className="w-full sm:w-auto">
          <Mails className="mr-2 h-4 w-4" />
          一斉メール送信
        </Button>
      </div>
      <Input
        type="text"
        placeholder="名前またはメールアドレスで検索"
        value={searchTerm}
        onChange={handleSearchChange}
        className="mb-4"
      />
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/2 sm:w-auto">名前</TableHead>
              <TableHead className="hidden sm:table-cell">
                メールアドレス
              </TableHead>
              <TableHead className="hidden sm:table-cell">電話番号</TableHead>
              <TableHead className="hidden sm:table-cell">予約回数</TableHead>
              <TableHead className="hidden sm:table-cell">総利用金額</TableHead>
              <TableHead className="w-1/2 sm:w-auto">アクション</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.email}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  {user.email}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {user.phone}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {user.reservationCount}回
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {user.totalSpent.toLocaleString()}円
                </TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        詳細
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{user.name}の詳細情報</DialogTitle>
                      </DialogHeader>
                      <div className="mt-4">
                        <p>
                          <strong>名前:</strong> {user.name}
                        </p>
                        <p>
                          <strong>メールアドレス:</strong> {user.email}
                        </p>
                        <p>
                          <strong>電話番号:</strong> {user.phone}
                        </p>
                        <p>
                          <strong>予約回数:</strong> {user.reservationCount}回
                        </p>
                        <p>
                          <strong>総利用金額:</strong>{" "}
                          {user.totalSpent.toLocaleString()}円
                        </p>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default UserList;
