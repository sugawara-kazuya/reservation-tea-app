'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { CommentSection } from '@/components/CommentSection'
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify";
import { getUrl } from 'aws-amplify/storage';
import { getCurrentUser } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';

const client = generateClient<Schema>();

type TeaParty = Schema["Event"]["type"];

interface TeaPartyDetailProps {
  eventId: string;
}

export function TeaPartyDetail({ eventId }: TeaPartyDetailProps) {
  const [teaParty, setTeaParty] = useState<TeaParty | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('ゲスト');
  const router = useRouter();

  useEffect(() => {
    const fetchUserAndTeaParty = async () => {
      try {
        const { userId: currentUserId } = await getCurrentUser();
        setUserId(currentUserId);

        // ユーザープロファイルの取得
        const { data: profiles } = await client.models.UserProfile.list({
          filter: {
            userId: { eq: currentUserId }
          }
        });

        if (profiles && profiles.length > 0) {
          setUserName(profiles[0].name || "ゲスト");
        }

        const { data: event, errors } = await client.models.Event.get({
          id: eventId
        });

        if (errors) {
          console.error("Error fetching tea party:", errors);
          return;
        }

        if (!event) {
          console.error("Tea party not found");
          return;
        }

        setTeaParty(event);

        // メイン画像のURLを取得
        if (event.imageUrl) {
          setImageUrls([event.imageUrl]);
        } else {
          setImageUrls(['/placeholder.jpg']);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching user and tea party:", error);
        router.push('/login');
      }
    };

    fetchUserAndTeaParty();
  }, [eventId, router]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  if (!teaParty) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Link href="/history" className="text-green-600 hover:underline mb-4 inline-block">&larr; 戻る</Link>
        <p className="text-center">お茶会が見つかりません</p>
      </div>
    );
  }

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === imageUrls.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? imageUrls.length - 1 : prevIndex - 1
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8"
    >
      <Link href="/history" className="text-green-600 hover:underline mb-4 inline-block">&larr; 戻る</Link>
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="relative h-96 w-full">
          <Image
            src={imageUrls[currentImageIndex] || '/placeholder.jpg'}
            alt={`${teaParty.title} - 画像 ${currentImageIndex + 1}`}
            layout="fill"
            objectFit="cover"
          />
          {imageUrls.length > 1 && (
            <>
              <button 
                onClick={prevImage} 
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full"
              >
                <ChevronLeft />
              </button>
              <button 
                onClick={nextImage} 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full"
              >
                <ChevronRight />
              </button>
            </>
          )}
        </div>
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">{teaParty.title}</h1>
          <p className="text-gray-600 mb-4">{teaParty.description}</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">日時</h2>
              <p className="text-gray-600">{teaParty.date}</p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">会場</h2>
              <p className="text-gray-600">{teaParty.venue}</p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">参加人数</h2>
              <p className="text-gray-600">{teaParty.currentParticipants}/{teaParty.maxParticipants}名</p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">参加費用</h2>
              <p className="text-gray-600">{teaParty.cost}円</p>
            </div>
          </div>
        </div>
      </div>
      {teaParty?.id && <CommentSection teaPartyId={teaParty.id} />}
    </motion.div>
  );
} 