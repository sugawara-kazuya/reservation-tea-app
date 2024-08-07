import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any unauthenticated user can "create", "read", "update", 
and "delete" any "Todo" records.
=========================================================================*/
const schema = a.schema({
  User: a
    .model({
      user_id: a.string(), // ユーザーID
      name: a.string(), // 名前
      email: a.string(), // メールアドレス
      phone: a.string(), // 電話番号
    })
    .authorization((allow) => [allow.guest()]),

  Event: a
    .model({
      event_id: a.string(), // イベントID
      title: a.string(), // タイトル
      venue: a.string(), // 会場
      date: a.string(), // 日付
      cost: a.integer(), // 費用
      description: a.string(), // 説明
      image_url: a.string(), // 画像URL
      max_participants: a.integer(), // 最大参加人数
    })
    .authorization((allow) => [allow.guest()]),

  Reservation: a
    .model({
      reservation_id: a.string(), // 予約ID
      user_id: a.string(), // ユーザーID
      event_id: a.string(), // イベントID
      reservation_time: a.string(), // 予約時間
      participants: a.integer(), // 参加人数
      total_cost: a.integer(), // 総費用
      notes: a.string(), // メモ
    })
    .authorization((allow) => [allow.guest()]),

  EventTimeSlot: a
    .model({
      event_id: a.string(), // イベントID
      time_slot: a.string(), // 時間スロット
      max_participants: a.integer(), // 最大参加人数
      current_participants: a.integer(), // 現在の参加人数
    })
    .authorization((allow) => [allow.guest()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "iam",
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
