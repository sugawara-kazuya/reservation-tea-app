'use client'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify";
import { useState, useEffect } from 'react';
import { getUrl } from 'aws-amplify/storage';
import { getCurrentUser } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';

const client = generateClient<Schema>();

type TeaParty = Schema["Event"]["type"];

export function TeaPartyGallery() {
  const [events, setEvents] = useState<TeaParty[]>([]);
  const [imageUrls, setImageUrls] = useState<{ [key: string]: string }>({});
  const [userId, setUserId] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const fetchUserAndEvents = async () => {
      try {
        const { userId: currentUserId } = await getCurrentUser();
        setUserId(currentUserId);

        const { data: userEvents, errors } = await client.models.Event.list({
          filter: {
            isActive: { eq: false }
          },
          authMode: 'userPool'
        });

        if (errors) {
          console.error('Error fetching events:', errors);
          return;
        }

        setEvents(userEvents);

        // 画像URLを取得
        const urls: { [key: string]: string } = {};
        for (const event of userEvents) {
          if (event?.id && event.imageUrl) {
            urls[event.id] = event.imageUrl;
          } else if (event?.id) {
            urls[event.id] = '/placeholder.jpg';
          }
        }
        setImageUrls(urls);
      } catch (error) {
        console.error('Error fetching user and events:', error);
        router.push('/login');
      }
    };

    fetchUserAndEvents();
  }, [router]);

  return (
    <motion.div 
      className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {events.map((event, index) => (
        event?.id && (
          <motion.div
            key={event.id}
            className="relative overflow-hidden rounded-lg shadow-lg"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Link href={`/history/${event.id}`} className="block">
              <div className="relative h-64 w-full">
                <Image
                  src={imageUrls[event.id] || '/placeholder.jpg'}
                  alt={event.title || ''}
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-40 transition-opacity duration-300 hover:bg-opacity-30" />
              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <h2 className="text-2xl font-semibold text-white mb-2 drop-shadow-lg">{event.title}</h2>
                <p className="text-white text-sm drop-shadow-lg">{event.description}</p>
                <p className="text-white text-sm mt-2 drop-shadow-lg">開催日: {event.date}</p>
                <p className="text-white text-sm drop-shadow-lg">会場: {event.venue}</p>
              </div>
            </Link>
          </motion.div>
        )
      ))}
    </motion.div>
  )
}

