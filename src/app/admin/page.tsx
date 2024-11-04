"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CalendarIcon, UsersIcon } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">管理ダッシュボード</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => handleNavigation("/admin/event")}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-6 w-6" />
              イベント一覧
            </CardTitle>
            <CardDescription>イベントの管理と閲覧</CardDescription>
          </CardHeader>
          <CardContent>
            <p>全てのイベントを表示し、管理します。</p>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">
              クリックして一覧を表示
            </p>
          </CardFooter>
        </Card>
        <Card
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => handleNavigation("/admin/userlist")}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="h-6 w-6" />
              ユーザー一覧
            </CardTitle>
            <CardDescription>ユーザーの管理と閲覧</CardDescription>
          </CardHeader>
          <CardContent>
            <p>全てのユーザーを表示し、管理します。</p>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">
              クリックして一覧を表示
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
