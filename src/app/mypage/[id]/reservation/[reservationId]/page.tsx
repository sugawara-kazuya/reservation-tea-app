'use client'

import { useState, useEffect } from "react"
import { Calendar, Users, Trash, ArrowLeft } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { useRouter, useParams } from "next/navigation"
import { Authenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'
import { generateClient } from "aws-amplify/data"
import type { Schema } from "@/amplify"

const client = generateClient<Schema>()

type ReservationWithEvent = {
  id?: string | null;
  userId?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  eventId?: string | null;
  reservationTime?: string | null;
  participants?: number | null;
  accompaniedGuest1?: string | null;
  accompaniedGuest2?: string | null;
  accompaniedGuest3?: string | null;
  accompaniedGuest4?: string | null;
  totalCost?: number | null;
  notes?: string | null;
  event?: Schema['Event']['type'] | null;
  timeSlot?: Schema['EventTimeSlot']['type'] | null;
  owner?: string | null;
};

export default function TeaCeremonyBooking() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string
  const reservationId = params.reservationId as string

  const [reservation, setReservation] = useState<ReservationWithEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [people, setPeople] = useState(1)
  const [companions, setCompanions] = useState<string[]>([])
  const [timeSlots, setTimeSlots] = useState<Schema["EventTimeSlot"]["type"][]>([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchReservation = async () => {
      try {
        const { data: reservationData } = await client.models.Reservation.get({
          id: reservationId
        }, {
          authMode: 'userPool'
        })

        if (reservationData && reservationData.eventId) {
          const { data: eventData } = await client.models.Event.get({
            id: reservationData.eventId
          }, {
            authMode: 'userPool'
          })

          const { data: timeSlotData } = await client.models.EventTimeSlot.list({
            filter: {
              eventId: {
                eq: reservationData.eventId
              }
            },
            authMode: 'userPool'
          })

          // タイムスロットを時間順にソート
          const sortedTimeSlots = timeSlotData.sort((a, b) => {
            if (!a.timeSlot || !b.timeSlot) return 0
            return a.timeSlot.localeCompare(b.timeSlot)
          })

          const matchingTimeSlot = sortedTimeSlots.find(slot => slot.id === reservationData.reservationTime)
          
          setTimeSlots(sortedTimeSlots)
          setSelectedTime(matchingTimeSlot?.id || null)
          setPeople(reservationData.participants || 1)
          
          // 同行者の設定
          const companions = []
          if (reservationData.accompaniedGuest1) companions.push(reservationData.accompaniedGuest1)
          if (reservationData.accompaniedGuest2) companions.push(reservationData.accompaniedGuest2)
          if (reservationData.accompaniedGuest3) companions.push(reservationData.accompaniedGuest3)
          if (reservationData.accompaniedGuest4) companions.push(reservationData.accompaniedGuest4)
          setCompanions(companions)

          const reservationWithEvent: ReservationWithEvent = {
            ...reservationData,
            event: eventData,
            timeSlot: matchingTimeSlot || null
          }

          setReservation(reservationWithEvent)
        }
      } catch (error) {
        console.error('Error fetching reservation:', error)
        toast({
          title: "エラー",
          description: "予約情報の取得に失敗しました。",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (reservationId) {
      fetchReservation()
    }
  }, [reservationId, toast])

  const validateTimeSlot = (timeSlotId: string | null, participantsCount: number) => {
    if (!timeSlotId) return "予約時間を選択してください"
    
    const selectedSlot = timeSlots.find(slot => slot.id === timeSlotId)
    if (!selectedSlot) return "選択された時間枠が見つかりません"

    const currentParticipants = selectedSlot.currentParticipants || 0
    const maxParticipants = selectedSlot.maxParticipants || 0
    
    // 現在の予約の参加者数を除外して計算
    const otherParticipants = currentParticipants - (reservation?.participants || 0)
    const totalParticipants = otherParticipants + participantsCount

    if (totalParticipants > maxParticipants) {
      return `選択された時間枠の残り定員は${maxParticipants - otherParticipants}名です`
    }

    return null
  }

  const handleTimeSelect = (timeSlotId: string | null) => {
    const error = validateTimeSlot(timeSlotId, people)
    if (error) {
      setValidationError(error)
      toast({
        title: "エラー",
        description: error,
        variant: "destructive",
      })
      return
    }
    setValidationError(null)
    setSelectedTime(timeSlotId)
  }

  const handlePeopleChange = (value: number) => {
    const error = validateTimeSlot(selectedTime, value)
    if (error) {
      setValidationError(error)
      toast({
        title: "エラー",
        description: error,
        variant: "destructive",
      })
      return
    }

    setValidationError(null)
    setPeople(value)
    if (value === 1) {
      setCompanions([])
    } else {
      const newCompanions = Array(value - 1).fill("")
      companions.forEach((companion, index) => {
        if (index < value - 1) {
          newCompanions[index] = companion
        }
      })
      setCompanions(newCompanions)
    }
  }

  const handleCompanionChange = (index: number, value: string) => {
    const newCompanions = [...companions]
    newCompanions[index] = value
    setCompanions(newCompanions)
  }

  const handleSave = async () => {
    if (!reservation || !selectedTime) return

    const error = validateTimeSlot(selectedTime, people)
    if (error) {
      setValidationError(error)
      toast({
        title: "エラー",
        description: error,
        variant: "destructive",
      })
      return
    }

    try {
      const updatedReservation = {
        id: reservationId,
        reservationTime: selectedTime,
        participants: people,
        accompaniedGuest1: companions[0] || null,
        accompaniedGuest2: companions[1] || null,
        accompaniedGuest3: companions[2] || null,
        accompaniedGuest4: companions[3] || null,
      }

      await client.models.Reservation.update(updatedReservation, {
        authMode: 'userPool'
      })

      toast({
        title: "予約を更新しました",
        description: "予約内容が正常に更新されました。",
      })
      router.push(`/mypage/${userId}`)
    } catch (error) {
      console.error('Error updating reservation:', error)
      toast({
        title: "エラー",
        description: "予約の更新に失敗しました。",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    try {
      // 予約情報を取得
      const { data: reservationData } = await client.models.Reservation.get({
        id: reservationId
      }, {
        authMode: 'userPool'
      })

      if (!reservationData) {
        throw new Error('予約情報が見つかりません')
      }

      // イベントの参加者数を更新
      if (reservationData.eventId) {
        const { data: eventData } = await client.models.Event.get({
          id: reservationData.eventId
        }, {
          authMode: 'userPool'
        })

        if (eventData) {
          const updatedEvent = {
            id: eventData.id,
            currentParticipants: (eventData.currentParticipants || 0) - (reservationData.participants || 0)
          }

          await client.models.Event.update(updatedEvent, {
            authMode: 'userPool'
          })
        }
      }

      // 時間枠の参加者数を更新
      if (reservationData.reservationTime) {
        const { data: timeSlotData } = await client.models.EventTimeSlot.get({
          id: reservationData.reservationTime
        }, {
          authMode: 'userPool'
        })

        if (timeSlotData) {
          const updatedTimeSlot = {
            id: timeSlotData.id,
            currentParticipants: (timeSlotData.currentParticipants || 0) - (reservationData.participants || 0)
          }

          await client.models.EventTimeSlot.update(updatedTimeSlot, {
            authMode: 'userPool'
          })
        }
      }

      // 予約を削除
      await client.models.Reservation.delete({
        id: reservationId
      }, {
        authMode: 'userPool'
      })

      toast({
        title: "予約をキャンセルしました",
        description: "予約が正常にキャンセルされました。",
        variant: "destructive",
      })
      router.push(`/mypage/${userId}`)
    } catch (error) {
      console.error('Error deleting reservation:', error)
      toast({
        title: "エラー",
        description: "予約のキャンセルに失敗しました。",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p>読み込み中...</p>
      </div>
    )
  }

  if (!reservation) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p>予約情報が見つかりません</p>
      </div>
    )
  }

  return (
    <Authenticator>
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm p-8 space-y-8">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => router.push(`/mypage/${userId}`)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-medium text-center flex-1">{reservation.event?.title}</h1>
        </div>

        <div className="space-y-6">
          {/* 時間選択 */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4" />
              予約時間
            </label>
            <div className="grid grid-cols-3 gap-3">
              {timeSlots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => handleTimeSelect(slot.id || null)}
                  className={`p-3 rounded-lg border transition-all ${
                    selectedTime === slot.id
                      ? "border-green-600 bg-green-50 text-green-600"
                      : "border-border hover:border-green-300"
                  } ${
                    validateTimeSlot(slot.id || null, people)
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  disabled={!!validateTimeSlot(slot.id || null, people)}
                >
                  <div>{slot.timeSlot}</div>
                  <div className="text-xs text-gray-500">
                    残り{(slot.maxParticipants || 0) - (slot.currentParticipants || 0)}名
                  </div>
                </button>
              ))}
            </div>
            {validationError && (
              <p className="text-red-500 text-sm">{validationError}</p>
            )}
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
            disabled={!!validationError}
            className={`flex-1 bg-green-600 text-white rounded-lg px-4 py-3 hover:bg-green-700 transition-colors ${
              validationError ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            更新する
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash className="h-5 w-5" />
          </button>
        </div>

        {/* 削除確認モーダル */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <h3 className="text-lg font-medium mb-4">予約をキャンセルしますか？</h3>
              <p className="text-gray-600 mb-6">
                この操作は取り消すことができません。
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    handleDelete()
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  削除する
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Authenticator>
  )
} 