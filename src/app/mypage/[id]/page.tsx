'use client'

import Image from "next/image"
import { Bell, ChevronLeft, Home, Search, Settings, User, LogOut } from 'lucide-react'
import { Header } from "@/components/header/Header";
import { useRouter, useParams } from "next/navigation"
import { signOut } from 'aws-amplify/auth'
import { toast } from "sonner"
import { generateClient } from "aws-amplify/data"
import type { Schema } from "@/amplify"
import { getCurrentUser } from 'aws-amplify/auth'
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Amplify } from "aws-amplify";
import outputs from "@/output";
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

Amplify.configure(outputs);

const client = generateClient<Schema>()

type ReservationWithEvent = Schema['Reservation']['type'] & {
  event: Schema['Event']['type'];
  timeSlot?: Schema['EventTimeSlot']['type'];
};

export default function TeaCeremonyProfile() {
  const router = useRouter()
  const params = useParams()
  const { authStatus } = useAuthenticator(context => [context.authStatus]);
  const userId = params.id as string
  const [profile, setProfile] = useState<Schema["UserProfile"]["type"] | null>(null)
  const [reservations, setReservations] = useState<ReservationWithEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [isCurrentUser, setIsCurrentUser] = useState(false)

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      if (authStatus !== 'authenticated') {
        toast.error('ログインが必要です');
        router.push('/');
        return;
      }

      const fetchUserProfileAndReservations = async () => {
        try {
          // 現在のログインユーザーのIDを取得
          const { userId: currentUserId } = await getCurrentUser()
          setIsCurrentUser(currentUserId === userId)
          console.log('Current user ID:', currentUserId)
          console.log('URL user ID:', userId)

          // プロフィール情報の取得
          const { data: profiles } = await client.models.UserProfile.list({
            filter: {
              userId: {
                eq: userId
              }
            },
            authMode: 'userPool'
          })
          console.log('Profiles found:', profiles)

          if (profiles.length > 0) {
            setProfile(profiles[0])
            console.log('Profile found:', profiles[0])

            // 予約情報の取得（イベント情報も含む）
            const { data: reservationData } = await client.models.Reservation.list({
              filter: {
                userId: {
                  eq: userId
                }
              },
              authMode: 'userPool'
            })
            console.log('Raw reservation data:', reservationData)
            console.log('Number of reservations found:', reservationData.length)

            // イベント情報を取得して結合
            const reservationsWithEvents = await Promise.all(
              reservationData.map(async (reservation) => {
                console.log('Processing reservation:', reservation)
                if (reservation.eventId) {
                  try {
                    const { data: eventData } = await client.models.Event.get({
                      id: reservation.eventId
                    }, {
                      authMode: 'userPool'
                    })
                    console.log('Event data found:', eventData)

                    // タイムスロット情報を取得
                    const { data: timeSlotData } = await client.models.EventTimeSlot.list({
                      filter: {
                        eventId: {
                          eq: reservation.eventId
                        }
                      },
                      authMode: 'userPool'
                    })
                    console.log('Time slot data found:', timeSlotData)

                    // 予約時間に一致するタイムスロットを探す
                    const matchingTimeSlot = timeSlotData.find(slot => slot.id === reservation.reservationTime)
                    console.log('Matching time slot:', matchingTimeSlot)

                    if (eventData) {
                      return {
                        ...reservation,
                        event: eventData,
                        timeSlot: matchingTimeSlot
                      }
                    }
                  } catch (error) {
                    console.error('Error fetching event data:', error)
                  }
                }
                console.log('No event data for reservation:', reservation)
                return reservation
              })
            )

            console.log('Final reservations with events:', reservationsWithEvents)
            setReservations(reservationsWithEvents.filter(r => r.event) as ReservationWithEvent[])
          } else {
            toast.error('プロフィールが見つかりません')
            router.push('/home')
            return
          }
        } catch (error) {
          console.error('Error fetching data:', error)
          toast.error('データの取得に失敗しました')
        } finally {
          setLoading(false)
        }
      }

      if (userId) {
        fetchUserProfileAndReservations()
      }
    };

    checkAuthAndFetchData();
  }, [userId, router, authStatus]);

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('ログアウトしました')
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error('ログアウトに失敗しました')
    }
  }

  const currentDate = new Date()
  const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
  
  const upcomingReservations = reservations.filter(reservation => {
    if (!reservation.event?.date) {
      console.log('No date for reservation:', reservation)
      return false
    }
    try {
      // 日本語の日付文字列（例：2024年3月20日（水））を処理
      const dateMatch = reservation.event.date.match(/(\d+)年(\d+)月(\d+)日/)
      if (!dateMatch) {
        console.log('Invalid date format:', reservation.event.date)
        return false
      }
      const [_, year, month, day] = dateMatch
      const eventDate = new Date(Number(year), Number(month) - 1, Number(day))
      console.log('Parsed event date:', eventDate)
      return eventDate >= today
    } catch (error) {
      console.error('Error parsing date:', error)
      return false
    }
  })

  const pastReservations = reservations.filter(reservation => {
    if (!reservation.event?.date) {
      console.log('No date for reservation:', reservation)
      return false
    }
    try {
      // 日本語の日付文字列（例：2024年3月20日（水））を処理
      const dateMatch = reservation.event.date.match(/(\d+)年(\d+)月(\d+)日/)
      if (!dateMatch) {
        console.log('Invalid date format:', reservation.event.date)
        return false
      }
      const [_, year, month, day] = dateMatch
      const eventDate = new Date(Number(year), Number(month) - 1, Number(day))
      console.log('Parsed event date:', eventDate)
      return eventDate < today
    } catch (error) {
      console.error('Error parsing date:', error)
      return false
    }
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p>読み込み中...</p>
      </div>
    )
  }

  return (
    <Authenticator>
      {({ signOut: authenticatorSignOut }) => (
        <div className="min-h-screen bg-white">
          <Header />

          <main className="max-w-2xl mx-auto px-4 py-6 pt-40">
            <div className="flex flex-col items-center gap-6">
              {/* Profile Info */}
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-1">{profile?.name || '名前未設定'}</h2>
                <p className="text-gray-600 mb-4">{profile?.bio || 'プロフィールを編集してください'}</p>
                {isCurrentUser && (
                  <div className="space-y-2">
                    <Button 
                      className="w-full max-w-xs bg-[#8BC34A] hover:bg-[#7CB342]"
                      onClick={() => router.push(`/mypage/${userId}/edit`)}
                    >
                      プロフィール更新
                    </Button>
                    <Button 
                      className="w-full max-w-xs bg-red-500 hover:bg-red-600 flex items-center justify-center gap-2"
                      onClick={handleSignOut}
                    >
                      <LogOut className="w-4 h-4" />
                      ログアウト
                    </Button>
                  </div>
                )}
              </div>

              {/* Tea Ceremony Schedule */}
              {/* {isCurrentUser && ( */}
                <>
                  <div className="w-full">
                    {/* Debug info */}
                    <div style={{ display: 'none' }}>
                      {JSON.stringify(upcomingReservations, null, 2)}
                    </div>
                    <h3 className="font-medium text-lg mb-4">予約中のお茶会</h3>
                    <div className="space-y-3">
                      {upcomingReservations.length > 0 ? (
                        upcomingReservations.map((reservation) => (
                          <Card key={reservation.id} className="hover:shadow-md transition-shadow duration-200">
                            <CardContent className="p-4">
                              <button
                                onClick={() => router.push(`/mypage/${userId}/reservation/${reservation.id}`)}
                                className="w-full text-left hover:opacity-75 transition-opacity duration-200"
                              >
                                <div className="flex flex-col gap-2">
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium text-lg">{reservation.event?.title}</span>
                                    <span className="text-gray-600">{reservation.event?.date}</span>
                                  </div>
                                  <div className="flex justify-end">
                                    <span className="text-gray-600 text-sm">予約時間: {reservation.timeSlot?.timeSlot || '時間情報なし'}</span>
                                  </div>
                                </div>
                              </button>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-4">予約中のお茶会はありません</p>
                      )}
                    </div>
                  </div>

                  {/* Past Tea Ceremonies */}
                  <div className="w-full">
                    <h3 className="font-medium text-lg mb-4">過去のお茶会</h3>
                    <div className="space-y-3">
                      {pastReservations.length > 0 ? (
                        pastReservations.map((reservation) => (
                          <Card key={reservation.id} className="hover:shadow-md transition-shadow duration-200">
                            <CardContent className="p-4">
                              <button
                                onClick={() => router.push(`/mypage/${userId}/reservation/${reservation.id}`)}
                                className="w-full text-left hover:opacity-75 transition-opacity duration-200"
                              >
                                <div className="flex flex-col gap-2">
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium text-lg">{reservation.event?.title}</span>
                                    <span className="text-gray-600">{reservation.event?.date}</span>
                                  </div>
                                  <div className="flex justify-end">
                                    <span className="text-gray-600 text-sm">予約時間: {reservation.timeSlot?.timeSlot || '時間情報なし'}</span>
                                  </div>
                                </div>
                              </button>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-4">過去のお茶会はありません</p>
                      )}
                    </div>
                  </div>
                </>
              {/* )} */}
            </div>
          </main>
        </div>
      )}
    </Authenticator>
  )
}

