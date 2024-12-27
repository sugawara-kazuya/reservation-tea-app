'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

type Comment = {
  id: number;
  author: string;
  content: string;
  createdAt: string;
  replies: Comment[];
}

type CommentSectionProps = {
  teaPartyId: number;
}

export function CommentSection({ teaPartyId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([
    {
      id: 1,
      author: "茶道愛好家",
      content: "素晴らしい抹茶会でした。季節感あふれる和菓子も絶品でした。",
      createdAt: "2023-04-06 10:30",
      replies: [
        {
          id: 2,
          author: "主催者",
          content: "ご参加ありがとうございました。次回もぜひお越しください。",
          createdAt: "2023-04-06 11:15",
          replies: []
        }
      ]
    },
    {
      id: 3,
      author: "初心者",
      content: "初めて参加しましたが、とても楽しかったです。作法など丁寧に教えていただき、感謝しています。",
      createdAt: "2023-04-07 09:45",
      replies: []
    }
  ])
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<number | null>(null)

  const addComment = () => {
    if (newComment.trim() === "") return

    const comment: Comment = {
      id: Date.now(),
      author: "ゲスト",
      content: newComment,
      createdAt: new Date().toLocaleString(),
      replies: []
    }

    if (replyingTo) {
      setComments(prevComments => {
        const updateReplies = (comments: Comment[]): Comment[] => {
          return comments.map(c => {
            if (c.id === replyingTo) {
              return { ...c, replies: [...c.replies, comment] }
            } else if (c.replies.length > 0) {
              return { ...c, replies: updateReplies(c.replies) }
            }
            return c
          })
        }
        return updateReplies(prevComments)
      })
      setReplyingTo(null)
    } else {
      setComments(prevComments => [...prevComments, comment])
    }

    setNewComment("")
  }

  const renderComment = (comment: Comment) => (
    <motion.div 
      key={comment.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white p-4 rounded-lg shadow mb-4"
    >
      <div className="flex justify-between items-start mb-2">
        <span className="font-semibold">{comment.author}</span>
        <span className="text-sm text-gray-500">{comment.createdAt}</span>
      </div>
      <p className="text-gray-700 mb-2">{comment.content}</p>
      <button 
        onClick={() => setReplyingTo(comment.id)}
        className="text-sm text-green-600 hover:underline"
      >
        返信
      </button>
      {replyingTo === comment.id && (
        <div className="mt-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="返信を入力..."
            className="w-full p-2 border rounded mb-2"
            rows={3}
          />
          <button
            onClick={addComment}
            className="bg-green-600 text-white py-1 px-3 rounded text-sm hover:bg-green-700 transition-colors"
          >
            返信を送信
          </button>
        </div>
      )}
      <div className="ml-4 mt-2">
        {comment.replies.map(reply => renderComment(reply))}
      </div>
    </motion.div>
  )

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">参加者の感想</h2>
      <div className="mb-4">
        {comments.map(comment => renderComment(comment))}
      </div>
      {!replyingTo && (
        <div className="bg-white p-4 rounded-lg shadow">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="感想を入力..."
            className="w-full p-2 border rounded mb-2"
            rows={3}
          />
          <button
            onClick={addComment}
            className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors"
          >
            感想を送信
          </button>
        </div>
      )}
    </div>
  )
}

