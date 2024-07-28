/**
 * v0 by Vercel.
 * @see https://v0.dev/t/tm0FB90oIbi
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function Component() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16">
      <div className="space-y-6 md:space-y-8">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold">予約画面</h1>
          <p className="text-muted-foreground mt-2 md:mt-3">
            茶道のお茶席を予約します。
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          <div className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="name">名前</Label>
              <Input id="name" placeholder="名前を入力してください" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">メール</Label>
              <Input
                id="email"
                type="email"
                placeholder="メールアドレスを入力してください"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">電話番号</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="電話番号を入力してください"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date-time">日時</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 justify-start">
                    <span className="font-medium">時間を選択</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 max-w-[276px] w-full">
                  <div className="grid grid-cols-1 gap-2 p-4">
                    <Button variant="ghost" size="sm">
                      12:00 PM (予約済み 2/12名)
                    </Button>
                    <Button variant="ghost" size="sm">
                      13:00 PM (予約済み 1/12名)
                    </Button>
                    <Button variant="ghost" size="sm">
                      14:00 PM (予約済み 7/12名)
                    </Button>
                    <Button variant="ghost" size="sm">
                      15:00 PM (予約済み 1/12名)
                    </Button>
                    <Button variant="ghost" size="sm">
                      16:00 PM (予約済み 4/12名)
                    </Button>
                    <Button variant="ghost" size="sm">
                      17:00 PM (予約済み 3/12名)
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">追加メモ</Label>
              <Textarea
                id="notes"
                rows={4}
                placeholder="追加のメモやリクエストを入力してください"
              />
            </div>
            <Button type="submit" className="w-full">
              今すぐ予約
            </Button>
          </div>
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">予約の詳細</h2>
              <div className="grid gap-2">
                <div className="flex items-center gap-4">
                  <CalendarIcon className="w-6 h-6" />
                  <div>
                    <div className="font-medium">2024年7月26日</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <PhoneIcon className="w-6 h-6" />
                  <div className="font-medium">(123) 456-7890</div>
                </div>
                <div className="flex items-center gap-4">
                  <CoinsIcon className="w-6 h-6" />
                  <div className="font-medium">3000円</div>
                </div>
                <div className="flex items-center gap-4">
                  <UsersIcon className="w-6 h-6" />
                  <div className="font-medium">各席上限12名</div>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>追加メモ</Label>
                <div className="text-muted-foreground">
                  服装自由、各席10分前までに白瀧呉服店の店舗玄関へお越しください。
                </div>
              </div>
              <div className="grid gap-2">
                <Image
                  src="https://reservation-tea-app.s3.ap-northeast-1.amazonaws.com/sample/sample2.jpeg"
                  alt="Event Image"
                  width={500}
                  height={300}
                  layout="responsive"
                  objectFit="cover"
                />
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">予約について</h2>
              <div className="prose text-muted-foreground">
                <p>各回開始10分前に、白瀧呉服店の店舗玄関へお越しください。</p>
                <p>その他必要事項を書く。</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface IconProps extends React.SVGProps<SVGSVGElement> {}

const CalendarIcon: React.FC<IconProps> = (props) => {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
};

const PhoneIcon: React.FC<IconProps> = (props) => {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
};

const UsersIcon: React.FC<IconProps> = (props) => {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
};

const XIcon: React.FC<IconProps> = (props) => {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
};

const CoinsIcon: React.FC<IconProps> = (props) => {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <path d="M7 6h1v4" />
      <path d="m16.71 13.88.7.71-2.82 2.82" />
    </svg>
  );
};
