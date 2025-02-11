'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronUp } from 'lucide-react'
import { Header } from "@/components/header/Header"
import { generateClient } from "aws-amplify/data"
import type { Schema } from "@/amplify";
import { getCurrentUser } from 'aws-amplify/auth'
import { toast } from "sonner"
import { Authenticator } from '@aws-amplify/ui-react';

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import '@aws-amplify/ui-react/styles.css'

const client = generateClient<Schema>()

export default function ProfileUpdate() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { userId: cognitoUserId } = await getCurrentUser()
        setUserId(cognitoUserId)

        const profiles = await client.models.UserProfile.list({
          filter: {
            userId: {
              eq: cognitoUserId
            }
          },
          authMode: 'userPool'
        })

        if (profiles.data.length > 0) {
          const profile = profiles.data[0]
          setName(profile.name || '')
          setEmail(profile.email || '')
          setPhone(profile.phone || '')
          setBio(profile.bio || '')
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
        toast.error('プロフィールの取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return

    try {
      const { data: profiles } = await client.models.UserProfile.list({
        filter: {
          userId: {
            eq: userId
          }
        },
        authMode: 'userPool'
      })

      const profileData = {
        name,
        email,
        phone,
        bio
      }

      if (profiles.length > 0) {
        // Update existing profile
        await client.models.UserProfile.update({
          id: profiles[0].id,
          ...profileData
        })
      } else {
        // Create new profile
        await client.models.UserProfile.create({
          userId,
          ...profileData
        })
      }

      toast.success('プロフィールを更新しました')
      router.push('/mypage/1')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('プロフィールの更新に失敗しました')
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <Authenticator>
      <div className="min-h-screen bg-white pt-16">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-6 pt-35">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">名前（フルネーム） *必須</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス *必須</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">電話番号（任意）</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">自己紹介（任意）</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex justify-end space-x-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => router.back()}
              >
                キャンセル
              </Button>
              <Button type="submit" className="bg-[#8BC34A] hover:bg-[#7CB342]">
                保存
              </Button>
            </div>
          </form>
        </main>

        {/* Back to Top Button */}
        {showBackToTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-20 right-4 p-2 bg-[#8BC34A] text-white rounded-full shadow-lg hover:bg-[#7CB342] transition-colors duration-200 md:bottom-4"
          >
            <ChevronUp className="w-6 h-6" />
          </button>
        )}
      </div>
    </Authenticator>
  );
}

