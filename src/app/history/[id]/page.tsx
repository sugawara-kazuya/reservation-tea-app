'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { CommentSection } from '@/components/CommentSection'

type TeaParty = {
  id: number;
  title: string;
  description: string;
  imageUrls: string[];
  fullDescription: string;
  date: string;
  location: string;
  capacity: number;
}

const teaParties: TeaParty[] = [
  {
    id: 1,
    title: "新緑の茶会",
    description: "桜の香り漂う、静寂の一服",
    imageUrls: [
      "https://tea-app-sample-pic.s3.ap-northeast-1.amazonaws.com/tea-app-sample-state-1.jpg",
      "https://tea-app-sample-pic.s3.ap-northeast-1.amazonaws.com/tea-app-sample-state-2.jpg",
      "https://tea-app-sample-pic.s3.ap-northeast-1.amazonaws.com/tea-app-sample-state-3.jpg",
    ],
    fullDescription: "新緑の候、桜花の舞う中での趣深い茶会を催します。床の間には季節の掛け軸と春の花を飾り、茶室から望む日本庭園の景色と共に、点てたての抹茶と主菓子をお楽しみください。茶道の作法を通じて、和の心に触れる静謐なひとときをご用意いたしました。",
    date: "2024年4月5日",
    location: "東京都千代田区 松月庵",
    capacity: 20
  },
  {
    id: 2,
    title: "七夕茶会",
    description: "星月夜に愉しむ夜茶の会",
    imageUrls: [
      "https://tea-app-sample-pic.s3.ap-northeast-1.amazonaws.com/tea-app-sample-state-1.jpg",
      "https://tea-app-sample-pic.s3.ap-northeast-1.amazonaws.com/tea-app-sample-state-2.jpg",
      "https://tea-app-sample-pic.s3.ap-northeast-1.amazonaws.com/tea-app-sample-state-3.jpg",
    ],
    fullDescription: "七夕の宵に、竹飾りの揺らめく灯りの下で開かれる趣向を凝らした茶会です。涼やかな夏の夜風を感じながら、季節の和菓子と共に薄茶を楽しみ、短冊に願いを込めて。茶室では笹の葉の飾りと共に、夏の夜の情緒をお楽しみください。",
    date: "2024年7月7日",
    location: "鎌倉市 竹林庵",
    capacity: 15
  },
  {
    id: 3,
    title: "中国茶藝の会",
    description: "千年の歴史が紡ぐ茶の世界",
    imageUrls: [
      "https://tea-app-sample-pic.s3.ap-northeast-1.amazonaws.com/tea-app-sample-state-1.jpg",
      "https://tea-app-sample-pic.s3.ap-northeast-1.amazonaws.com/tea-app-sample-state-2.jpg",
      "https://tea-app-sample-pic.s3.ap-northeast-1.amazonaws.com/tea-app-sample-state-3.jpg",
    ],
    fullDescription: "古来より伝わる中国茶藝の真髄に触れる特別な会。厳選された烏龍茶や工夫紅茶を、伝統的な茶器を用いて味わいます。茶葉の移ろいゆく香りと味わいを、点茶の所作と共にご堪能ください。茶席では、中国茶文化の奥深さについても解説いたします。",
    date: "2024年6月10日",
    location: "横浜中華街 悟空茶房",
    capacity: 12
  },
  {
    id: 4,
    title: "涼煎茶の会",
    description: "清涼な一煎に夏の暑さを忘れる",
    imageUrls: [
      "https://tea-app-sample-pic.s3.ap-northeast-1.amazonaws.com/tea-app-sample-state-1.jpg",
      "https://tea-app-sample-pic.s3.ap-northeast-1.amazonaws.com/tea-app-sample-state-2.jpg",
      "https://tea-app-sample-pic.s3.ap-northeast-1.amazonaws.com/tea-app-sample-state-3.jpg",
    ],
    fullDescription: "真夏の暑さを忘れさせる、涼を誘う煎茶の会。八十八夜摘みの新茶や、玉露の冷茶を中心に、季節の干菓子と共にお楽しみいただきます。涼やかな茶器の音色に耳を傾けながら、日本の夏の風情をお楽しみください。茶席からは、川のせせらぎも聞こえます。",
    date: "2024年8月15日",
    location: "京都市左京区 納涼茶寮",
    capacity: 18
  },
]

export default function TeaPartyDetail() {
  const params = useParams()
  const id = Number(params.id)
  const teaParty = teaParties.find(party => party.id === id)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === teaParty!.imageUrls.length - 1 ? 0 : prevIndex + 1
      )
    }, 5000)

    return () => clearInterval(timer)
  }, [teaParty])

  if (!teaParty) {
    return <div>お茶会が見つかりません</div>
  }

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === teaParty.imageUrls.length - 1 ? 0 : prevIndex + 1
    )
  }

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? teaParty.imageUrls.length - 1 : prevIndex - 1
    )
  }

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
            src={teaParty.imageUrls[currentImageIndex]}
            alt={`${teaParty.title} - 画像 ${currentImageIndex + 1}`}
            layout="fill"
            objectFit="cover"
          />
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
        </div>
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">{teaParty.title}</h1>
          <p className="text-gray-600 mb-4">{teaParty.fullDescription}</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">日時</h2>
              <p className="text-gray-600">{teaParty.date}</p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">場所</h2>
              <p className="text-gray-600">{teaParty.location}</p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">定員</h2>
              <p className="text-gray-600">{teaParty.capacity}名</p>
            </div>
          </div>
        </div>
      </div>
      <CommentSection teaPartyId={teaParty.id} />
    </motion.div>
  )
}

