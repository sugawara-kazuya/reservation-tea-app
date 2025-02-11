'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify";
import { getCurrentUser } from 'aws-amplify/auth';
import { Pencil, Trash2, Reply } from 'lucide-react';

const client = generateClient<Schema>();

type Comment = Schema["Comment"]["type"];

interface CommentWithReplies {
  id?: string;
  content?: string;
  eventId?: string;
  userId?: string;
  userName?: string;
  parentCommentId?: string;
  createdAt?: string;
  updatedAt?: string;
  replies: CommentWithReplies[];
}

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
        <h3 className="text-xl font-bold mb-4">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            キャンセル
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            確認
          </button>
        </div>
      </div>
    </div>
  );
};

interface CommentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  comment: CommentWithReplies | null;
}

const CommentDetailModal: React.FC<CommentDetailModalProps> = ({ isOpen, onClose, comment }) => {
  if (!isOpen || !comment) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold">{comment.userName}さんのコメント</h3>
            <p className="text-sm text-gray-500">
              {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ''}
              {comment.updatedAt && comment.updatedAt !== comment.createdAt && 
                ` (編集済み: ${new Date(comment.updatedAt).toLocaleString()})`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <div className="mb-6">
          <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
        </div>
        {comment.replies && comment.replies.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">返信 ({comment.replies.length})</h4>
            <div className="space-y-4">
              {comment.replies.map(reply => (
                <div key={reply.id} className="bg-gray-50 p-4 rounded">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold">{reply.userName}</span>
                    <span className="text-sm text-gray-500">
                      {reply.createdAt ? new Date(reply.createdAt).toLocaleString() : ''}
                    </span>
                  </div>
                  <p className="text-gray-700">{reply.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

type CommentSectionProps = {
  teaPartyId: string;
}

export function CommentSection({ teaPartyId }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [targetComment, setTargetComment] = useState<CommentWithReplies | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedComment, setSelectedComment] = useState<CommentWithReplies | null>(null);

  const convertToCommentWithReplies = (comment: Comment): CommentWithReplies => ({
    id: comment.id || undefined,
    content: comment.content || undefined,
    eventId: comment.eventId || undefined,
    userId: comment.userId || undefined,
    userName: comment.userName || undefined,
    parentCommentId: comment.parentCommentId || undefined,
    createdAt: comment.createdAt || undefined,
    updatedAt: comment.updatedAt || undefined,
    replies: []
  });

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profiles } = await client.models.UserProfile.list({
        filter: {
          userId: { eq: userId }
        }
      });

      if (!profiles || profiles.length === 0) {
        return null;
      }

      return profiles[0];
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  };

  const fetchComments = async () => {
    try {
      const { data: mainComments, errors: mainErrors } = await client.models.Comment.list({
        filter: {
          eventId: { eq: teaPartyId },
          isReply: { eq: false },
          parentCommentId: { eq: "none" }
        }
      });

      if (mainErrors) {
        console.error("Error fetching main comments:", mainErrors);
        return;
      }

      const commentsWithReplies = await Promise.all(
        mainComments.map(async (comment) => {
          const mainComment = convertToCommentWithReplies(comment);
          if (!mainComment.id) return mainComment;

          const { data: replies, errors: replyErrors } = await client.models.Comment.list({
            filter: {
              eventId: { eq: teaPartyId },
              isReply: { eq: true },
              parentCommentId: { eq: mainComment.id }
            }
          });

          if (replyErrors) {
            console.error("Error fetching replies:", replyErrors);
            return mainComment;
          }

          return {
            ...mainComment,
            replies: replies.map(convertToCommentWithReplies)
          };
        })
      );

      setComments(commentsWithReplies);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const currentUser = await getCurrentUser();
        const profile = await fetchUserProfile(currentUser.userId);
        
        setUserId(currentUser.userId);
        if (profile && profile.name) {
          setUserName(profile.name);
        } else {
          setUserName(currentUser.username || "ゲスト");
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };

    fetchUserInfo();
    fetchComments();
  }, [teaPartyId]);

  const addComment = async () => {
    if (newComment.trim() === "") return;

    try {
      const commentData = {
        content: newComment,
        eventId: teaPartyId,
        userId: userId,
        userName: userName,
        isReply: Boolean(replyingTo),
        parentCommentId: replyingTo || "none"
      };

      const { data: newCommentData, errors } = await client.models.Comment.create(commentData);

      if (errors) {
        console.error("Error creating comment:", errors);
        return;
      }

      if (!newCommentData) {
        console.error("No comment data returned");
        return;
      }

      const newCommentWithReplies = convertToCommentWithReplies(newCommentData);

      if (replyingTo) {
        setComments(prevComments => 
          prevComments.map(comment => {
            if (comment.id === replyingTo) {
              return {
                ...comment,
                replies: [...comment.replies, newCommentWithReplies]
              };
            }
            return comment;
          })
        );
        setReplyingTo(null);
      } else {
        setComments(prevComments => [...prevComments, newCommentWithReplies]);
      }

      setNewComment("");
      fetchComments();
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const deleteComment = async (comment: CommentWithReplies) => {
    if (!comment.id) return;

    try {
      const { errors } = await client.models.Comment.delete({
        id: comment.id
      });

      if (errors) {
        console.error("Error deleting comment:", errors);
        return;
      }

      fetchComments();
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const updateComment = async (comment: CommentWithReplies) => {
    if (!comment.id || !editContent.trim()) return;

    try {
      const { errors } = await client.models.Comment.update({
        id: comment.id,
        content: editContent
      });

      if (errors) {
        console.error("Error updating comment:", errors);
        return;
      }

      setEditingComment(null);
      setEditContent("");
      fetchComments();
    } catch (error) {
      console.error("Error updating comment:", error);
    }
  };

  const renderComment = (comment: CommentWithReplies) => (
    <motion.div 
      key={comment.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white p-4 rounded-lg shadow mb-4"
    >
      <div 
        onClick={() => {
          setSelectedComment(comment);
          setShowDetailModal(true);
        }}
        className="cursor-pointer hover:bg-gray-50 transition-colors duration-200"
      >
        <div className="flex justify-between items-start mb-2">
          <span className="font-semibold">{comment.userName}</span>
          <span className="text-sm text-gray-500">
            {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ''}
          </span>
        </div>
        {editingComment === comment.id ? (
          <div className="mb-2" onClick={e => e.stopPropagation()}>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-2 border rounded mb-2"
              rows={3}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowEditModal(true);
                  setTargetComment(comment);
                }}
                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
              >
                更新
              </button>
              <button
                onClick={() => {
                  setEditingComment(null);
                  setEditContent("");
                }}
                className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                キャンセル
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-700 mb-2">{comment.content}</p>
        )}
      </div>
      <div className="flex justify-end items-center space-x-4" onClick={e => e.stopPropagation()}>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            comment.id && setReplyingTo(comment.id);
          }}
          className="flex items-center text-sm text-green-600 hover:text-green-700"
        >
          <Reply size={16} className="mr-1" />
          <span>返信</span>
        </button>
        {comment.userId === userId && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingComment(comment.id || null);
                setEditContent(comment.content || "");
              }}
              className="text-sm text-blue-600 hover:text-blue-700"
              title="編集"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteModal(true);
                setTargetComment(comment);
              }}
              className="text-sm text-red-600 hover:text-red-700"
              title="削除"
            >
              <Trash2 size={16} />
            </button>
          </>
        )}
      </div>
      {replyingTo === comment.id && (
        <div className="mt-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="返信を入力..."
            className="w-full p-2 border rounded mb-2"
            rows={3}
          />
          <div className="flex justify-end">
            <button
              onClick={addComment}
              className="bg-green-600 text-white py-1 px-3 rounded text-sm hover:bg-green-700 transition-colors"
            >
              返信を送信
            </button>
          </div>
        </div>
      )}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-4 mt-2">
          {comment.replies.map(reply => renderComment(reply))}
        </div>
      )}
    </motion.div>
  );

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
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setTargetComment(null);
        }}
        onConfirm={() => {
          if (targetComment) {
            deleteComment(targetComment);
          }
        }}
        title="コメントの削除"
        message="このコメントを削除してもよろしいですか？"
      />
      <ConfirmModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setTargetComment(null);
        }}
        onConfirm={() => {
          if (targetComment) {
            updateComment(targetComment);
          }
        }}
        title="コメントの編集"
        message="このコメントを更新してもよろしいですか？"
      />
      <CommentDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedComment(null);
        }}
        comment={selectedComment}
      />
    </div>
  );
}

