/**
 * v0 by Vercel.
 * @see https://v0.dev/t/gaHXxv9XoCw
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header/Header";

export default function Component() {
  return (
    <div className="min-h-screen bg-white">
      <Header backgroundImage="https://reservation-tea-app.s3.ap-northeast-1.amazonaws.com/sample/homeback4.jpg" />
      <main className="flex flex-col items-center w-full flex-1 p-6 bg-white">
        <div className="max-w-2xl w-full space-y-8">
          <h2 className="text-3xl font-bold text-center">予約キャンセル</h2>
          <p className="text-center text-gray-700">
            予約をキャンセルするには、以下の情報を入力してください。
          </p>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reservation-id">予約ID</Label>
              <Input
                id="reservation-id"
                placeholder="予約IDを入力してください"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                placeholder="メールアドレスを入力してください"
              />
            </div>
            <div className="flex justify-end space-x-4">
              <Button>予約確認</Button>
              <Button
                type="submit"
                variant="destructive"
                className="bg-red-500 text-white hover:bg-red-600 rounded-md px-4 py-2 font-medium"
              >
                予約キャンセル
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
