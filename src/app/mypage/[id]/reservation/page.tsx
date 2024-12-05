'use client'

import { useState } from "react"
import { Calendar, Users, Trash, ArrowLeft } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function TeaCeremonyBooking() {
  const router = useRouter()
  const [selectedTime, setSelectedTime] = useState("10:00")
  const [people, setPeople] = useState(1)
  const [companions, setCompanions] = useState<string[]>([])
  const { toast } = useToast()

  const timeSlots = [
    "10:00",
    "11:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
  ]

  const handlePeopleChange = (value: number) => {
    setPeople(value)
    if (value === 1) {
      setCompanions([])
    } else {
      setCompanions(Array(value - 1).fill(""))
    }
  }

  const handleCompanionChange = (index: number, value: string) => {
    const newCompanions = [...companions]
    newCompanions[index] = value
    setCompanions(newCompanions)
  }

  const handleSave = () => {
    toast({
      title: "予約を更新しました",
      description: "予約内容が正常に更新されました。",
    })
    router.back()
  }

  const handleDelete = () => {
    toast({
      title: "予約をキャンセルしました",
      description: "予約が正常にキャンセルされました。",
      variant: "destructive",
    })
  }

  return (
    <div 
      style={{ backgroundImage: "url('/path/to/image.jpg')" }}
      className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm p-8 space-y-8"
    >
      <div className="flex items-center justify-between">
        <button 
          onClick={() => router.back()} 
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-medium text-center flex-1">季節のお茶会</h1>
      </div>

      <div className="space-y-6">
        {/* 時間選択 */}
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="h-4 w-4" />
            予約時間
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {timeSlots.map((time) => (
              <button
                key={time}
                onClick={() => setSelectedTime(time)}
                className={`p-3 rounded-lg border transition-all ${
                  selectedTime === time
                    ? "border-green-600 bg-green-50 text-green-600"
                    : "border-border hover:border-green-300"
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        {/* 人数選択 */}
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-medium">
            <Users className="h-4 w-4" />
            予約人数
          </label>
          <div className="flex gap-3">
            {[1, 2, 3, 4].map((num) => (
              <button
                key={num}
                onClick={() => handlePeopleChange(num)}
                className={`flex-1 p-3 rounded-lg border transition-all ${
                  people === num
                    ? "border-green-600 bg-green-50 text-green-600"
                    : "border-border hover:border-green-300"
                }`}
              >
                {num}人
              </button>
            ))}
          </div>
        </div>

        {/* 同行者入力 */}
        {companions.length > 0 && (
          <div className="space-y-4 animate-fade-in">
            <label className="text-sm font-medium">同行者</label>
            <div className="space-y-3">
              {companions.map((companion, index) => (
                <input
                  key={index}
                  type="text"
                  value={companion}
                  onChange={(e) => handleCompanionChange(index, e.target.value)}
                  placeholder={`同行者 ${index + 1}`}
                  className="w-full p-3 rounded-lg border border-border focus:border-green-600 focus:ring-1 focus:ring-green-600 transition-all outline-none"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4 pt-4">
        <button
          onClick={handleSave}
          className="flex-1 bg-green-600 text-white rounded-lg px-4 py-3 hover:bg-green-700 transition-colors"
        >
          更新する
        </button>
        <button
          onClick={handleDelete}
          className="px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

