'use client'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

type TeaParty = {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
}

const teaParties: TeaParty[] = [
  { id: 1, title: "新緑の茶会", description: "桜の香り漂う、静寂の一服", imageUrl: "/placeholder.svg?height=600&width=800" },
  { id: 2, title: "七夕茶会", description: "星月夜に愉しむ夜茶の会", imageUrl: "/placeholder.svg?height=600&width=800" },
  { id: 3, title: "中国茶藝の会", description: "千年の歴史が紡ぐ茶の世界", imageUrl: "/placeholder.svg?height=600&width=800" },
  { id: 4, title: "涼煎茶の会", description: "清涼な一煎に夏の暑さを忘れる", imageUrl: "/placeholder.svg?height=600&width=800" },
]

export function TeaPartyGallery() {
  return (
    <motion.div 
      className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {teaParties.map((party, index) => (
        <motion.div
          key={party.id}
          className="relative overflow-hidden rounded-lg shadow-lg"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <Link href={`/history/${party.id}`} className="block">
            <div className="relative h-64 w-full">
              <Image
                src={party.imageUrl}
                alt={party.title}
                layout="fill"
                objectFit="cover"
                className="transition-transform duration-300 hover:scale-105"
              />
            </div>
            <div className="absolute inset-0 bg-black bg-opacity-40 transition-opacity duration-300 hover:bg-opacity-30" />
            <div className="absolute inset-0 p-6 flex flex-col justify-end">
              <h2 className="text-2xl font-semibold text-white mb-2 drop-shadow-lg">{party.title}</h2>
              <p className="text-white text-sm drop-shadow-lg">{party.description}</p>
            </div>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  )
}

