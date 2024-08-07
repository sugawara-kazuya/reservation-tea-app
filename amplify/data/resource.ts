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
      name: a.string(), // 名前
      email: a.email(), // メールアドレス
      phone: a.phone(), // 電話番号
      userId: a.id(),
      reservation: a.belongsTo("Reservation", "userId"),
    })
    .authorization((allow) => [allow.guest()]),

  Event: a
    .model({
      title: a.string(), // タイトル
      venue: a.string(), // 会場
      date: a.string(), // 日付
      cost: a.integer(), // 費用
      description: a.string(), // 説明
      imageUrl: a.string(), // 画像URL
      maxParticipants: a.integer(), // 最大参加人数
      isActive: a.boolean(), // イベントが開催中かどうか
      eventId: a.id(),
      reservation: a.belongsTo("Reservation", "eventId"),
      eventTimeSlot: a.belongsTo("EventTimeSlot", "eventId"),
    })
    .authorization((allow) => [allow.guest()]),

  Reservation: a
    .model({
      userId: a.hasMany("User", "userId"), // ユーザーID
      eventId: a.hasMany("Event", "eventId"), // イベントID
      reservationTime: a.string(), // 予約時間
      participants: a.integer(), // 参加人数
      totalCost: a.integer(), // 総費用
      notes: a.string(), // メモ
    })
    .authorization((allow) => [allow.guest()]),

  EventTimeSlot: a
    .model({
      event: a.hasMany("Event", "eventId"),
      timeSlot: a.string(), // 時間スロット
      maxParticipants: a.integer(), // 最大参加人数
      currentParticipants: a.integer(), // 現在の参加人数
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
