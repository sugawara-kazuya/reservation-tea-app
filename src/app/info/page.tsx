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

export default function Component() {
  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center justify-between p-4 bg-primary text-white">
        <div className="text-2xl font-bold">sekishu</div>
        <nav className="flex space-x-4">
          <a href="/home" className="hover:underline">
            ホーム
          </a>
          <a href="/info" className="hover:underline">
            予約確認
          </a>
          <a href="#" className="hover:underline">
            お問い合わせ
          </a>
        </nav>
      </header>
      <main className="flex flex-col items-center w-full flex-1 p-6 bg-white">
        <div className="max-w-2xl w-full space-y-8">
          <h1 className="text-3xl font-bold text-center">予約キャンセル</h1>
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
