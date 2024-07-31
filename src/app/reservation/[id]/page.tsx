"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function Component() {
  const router = useRouter();
  const handleReservation = () => {
    // Here you can also add any form validation or data submission logic
    // For now, we just navigate to the confirmation page
    router.push("/home");
  };
  return (
    <div className="min-h-screen bg-white">
      <main className="p-4">
        <section className="text-center my-8">
          <h1 className="text-4xl font-bold mb-4">予約確認</h1>
          <p className="text-lg">以下の内容で予約が完了しました。</p>
        </section>
        <section className="max-w-2xl mx-auto bg-gray-100 p-6 rounded-md shadow-md">
          <h2 className="text-2xl font-semibold mb-4">予約内容</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="font-medium">イベント名:</span>
              <span>全国民文化祭</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">会場:</span>
              <span>勘定館</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">日時:</span>
              <span>2024年7月27日(土)</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">参加費:</span>
              <span>1500円</span>
            </div>
          </div>
        </section>
        <section className="max-w-2xl mx-auto bg-gray-100 p-6 rounded-md shadow-md mt-8">
          <h2 className="text-2xl font-semibold mb-4">予約者情報</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="font-medium">名前:</span>
              <span>山田 太郎</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">メールアドレス:</span>
              <span>taro.yamada@example.com</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">電話番号:</span>
              <span>090-1234-5678</span>
            </div>
          </div>
        </section>
        <div className="flex justify-center mt-8">
          <Button type="button" variant="default" onClick={handleReservation}>
            ホームに戻る
          </Button>
        </div>
      </main>
    </div>
  );
}
