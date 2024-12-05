'use client'

import Image from "next/image"
import { Bell, ChevronLeft, Home, Search, Settings, User } from 'lucide-react'
import { Header } from "@/components/header/Header";
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function TeaCeremonyProfile() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Main Content - paddingTopを追加 */}
      <main className="max-w-2xl mx-auto px-4 py-6 pt-40">
        <div className="flex flex-col items-center gap-6">

          {/* Profile Info */}
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-1">山田 太郎</h2>
            <p className="text-gray-600 mb-4">茶道愛好家</p>
            <Button 
              className="w-full max-w-xs bg-[#8BC34A] hover:bg-[#7CB342]"
              onClick={() => router.push(`/mypage/1/edit`)}
            >
              プロフィール更新
            </Button>
          </div>

          {/* Tea Ceremony Schedule */}
          <div className="w-full">
            <h3 className="font-medium text-lg mb-4">予約中のお茶会</h3>
            <div className="space-y-3">
              <Card>
                <CardContent className="p-0">
                  <button
                    onClick={() => router.push(`/mypage/1/reservation`)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex justify-between items-center">
                      <span>抹茶の会</span>
                      <span className="text-gray-600">14:00 - 15:00</span>
                    </div>
                  </button>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-0">
                  <button
                    onClick={() => router.push(`/mypage/1/reservation`)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex justify-between items-center">
                      <span>煎茶の会</span>
                      <span className="text-gray-600">16:00 - 17:00</span>
                    </div>
                  </button>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-0">
                  <button
                    onClick={() => router.push(`/mypage/1/reservation`)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex justify-between items-center">
                      <span>玉露の会</span>
                      <span className="text-gray-600">18:00 - 19:00</span>
                    </div>
                  </button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Past Tea Ceremonies */}
          <div className="w-full">
            <h3 className="font-medium text-lg mb-4">過去のお茶会</h3>
            <div className="space-y-3">
              <Card>
                <CardContent className="p-0">
                  <button
                    onClick={() => console.log('Clicked on tea ceremony session')}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex justify-between items-center">
                      <span>抹茶の会</span>
                      <span className="text-gray-600">14:00 - 15:00</span>
                    </div>
                  </button>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-0">
                  <button
                    onClick={() => console.log('Clicked on tea ceremony session')}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex justify-between items-center">
                      <span>煎茶の会</span>
                      <span className="text-gray-600">16:00 - 17:00</span>
                    </div>
                  </button>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-0">
                  <button
                    onClick={() => console.log('Clicked on tea ceremony session')}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex justify-between items-center">
                      <span>玉露の会</span>
                      <span className="text-gray-600">18:00 - 19:00</span>
                    </div>
                  </button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

