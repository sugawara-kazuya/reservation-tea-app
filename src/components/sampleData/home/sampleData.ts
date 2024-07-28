// events.ts
export interface Event {
  id: number; // ID を追加
  title: string;
  venue: string;
  date: string;
  cost: string;
  description: string;
  imageUrl: string;
}

export const events: Event[] = [
  {
    id: 1, // ID を追加
    title: "全国民文化祭",
    venue: "駿府城",
    date: "2024年7月27日(土)",
    cost: "1500円",
    description: "5年に一度行われるお茶会で長岡の学生さんたちも参加します",
    imageUrl:
      "https://reservation-tea-app.s3.ap-northeast-1.amazonaws.com/sample/sample1.jpg",
  },
  {
    id: 2, // ID を追加
    title: "石州流茶の湯 月釜 7月",
    venue: "白鷹温泉 和室広間",
    date: "2024年7月27日(土)",
    cost: "1500円",
    description: "各席8〜12名（45分）どなたでも参加いただけます。（服装自由）",
    imageUrl:
      "https://reservation-tea-app.s3.ap-northeast-1.amazonaws.com/sample/sample2.jpeg",
  },
];
