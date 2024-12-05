'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronUp } from 'lucide-react'
import { Header } from "@/components/header/Header";

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export default function ProfileUpdate() {
  const router = useRouter()
  const [name, setName] = useState('山田 太郎')
  const [email, setEmail] = useState('yamada@example.com')
  const [bio, setBio] = useState('茶道愛好家')
  const [showBackToTop, setShowBackToTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically send the updated profile data to your backend
    console.log('Profile updated:', { name, email, bio })
    // After successful update, navigate back to the profile page
    router.push('/profile')
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-white pt-16"> {/* Added pt-16 to push content down */}
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 pt-35">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">名前</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">自己紹介</Label>
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
  )
}

