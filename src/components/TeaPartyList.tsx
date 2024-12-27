import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type TeaParty = {
  id: number;
  title: string;
  date: string;
  location: string;
  participants: number;
  tags: string[];
}

const teaParties: TeaParty[] = [
  { id: 1, title: "春のお茶会", date: "2023-04-15", location: "東京都渋谷区", participants: 15, tags: ["抹茶", "和菓子"] },
  { id: 2, title: "英国風アフタヌーンティー", date: "2023-05-20", location: "横浜市中区", participants: 10, tags: ["紅茶", "スコーン"] },
  { id: 3, title: "中国茶を楽しむ会", date: "2023-06-10", location: "大阪市中央区", participants: 8, tags: ["烏龍茶", "プーアル茶"] },
  { id: 4, title: "夏の冷茶パーティー", date: "2023-07-30", location: "京都市左京区", participants: 20, tags: ["煎茶", "和菓子"] },
]

export function TeaPartyList() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {teaParties.map((party) => (
        <Card key={party.id}>
          <CardHeader>
            <CardTitle>{party.title}</CardTitle>
            <CardDescription>{party.date} - {party.location}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-2">参加者数: {party.participants}人</p>
            <div className="flex flex-wrap gap-2">
              {party.tags.map((tag) => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

