import { defineStorage } from "@aws-amplify/backend";

export const storage = defineStorage({
  name: "tea",
  access: (allow) => ({
    "event/*": [
      // 未認証ユーザー（ゲスト）に読み取り、書き込み、削除の権限を付与
      allow.guest.to(["read", "write", "delete"]),
    ],
  }),
});
