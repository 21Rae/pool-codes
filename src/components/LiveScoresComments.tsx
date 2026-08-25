import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Heart, Flame, Sparkles, Trophy, User as UserIcon, RefreshCw } from 'lucide-react';

interface LiveComment {
  id: string;
  match_id?: string;
  user_id?: string;
  username: string;
  comment: string;
  team_tag?: string;
  created_at: string;
  likes: number;
}

interface LiveScoresCommentsProps {
  currentUser?: any;
  selectedMatchId?: string;
  matchFixtureName?: string;
  triggerToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function LiveScoresComments({
  currentUser,
  selectedMatchId,
  matchFixtureName,
  triggerToast
}: LiveScoresCommentsProps) {
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [selectedTag, setSelectedTag] = useState('⚽️ Banker Draw');
  const [authorName, setAuthorName] = useState(
    currentUser?.username ? `@${currentUser.username.replace('@', '')}` : 'Pool Fan'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});

  const TAGS = [
    '⚽️ Banker Draw',
    '🔥 Goal Alert',
    '⚡️ High Odds',
    '📊 Pool Tip',
    '💥 Game On'
  ];

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const url = selectedMatchId 
        ? `/api/livescores/comments?match_id=${encodeURIComponent(selectedMatchId)}`
        : '/api/livescores/comments';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.comments)) {
          setComments(data.comments);
        }
      }
    } catch (err) {
      console.warn('Comments fetch notice:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [selectedMatchId]);

  useEffect(() => {
    if (currentUser?.username) {
      setAuthorName(`@${currentUser.username.replace('@', '')}`);
    }
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) {
      triggerToast?.('Please type a comment before posting.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/livescores/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          match_id: selectedMatchId || undefined,
          user_id: currentUser?.id || 'guest',
          username: authorName.trim() || 'Pool Fan',
          comment: newComment.trim(),
          team_tag: selectedTag
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setNewComment('');
          fetchComments();
          triggerToast?.('Comment posted to Live Scores discussion!', 'success');
        }
      }
    } catch (err) {
      triggerToast?.('Failed to post comment. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (commentId: string) => {
    if (likedMap[commentId]) return;
    setLikedMap(prev => ({ ...prev, [commentId]: true }));
    setComments(prev =>
      prev.map(c => (c.id === commentId ? { ...c, likes: (c.likes || 0) + 1 } : c))
    );

    try {
      await fetch('/api/livescores/comments/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: commentId })
      });
    } catch (_) {}
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
      if (seconds < 60) return 'just now';
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    } catch (_) {
      return 'recent';
    }
  };

  return (
    <div className="w-full bg-[#0a1512]/90 border border-emerald-900/40 rounded-2xl p-5 shadow-xl flex flex-col gap-4 text-left">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-emerald-950/80 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black font-sans text-white tracking-wide flex items-center gap-2">
              <span>Live Scores Fan Discussion & Banker Chat</span>
              <span className="text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                {comments.length}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 font-sans">
              {matchFixtureName ? `Discussing: ${matchFixtureName}` : 'Share live pool observations, draw perms, and real-time reactions.'}
            </p>
          </div>
        </div>

        <button
          onClick={fetchComments}
          disabled={isLoading}
          className="text-xs font-mono font-bold text-emerald-400 hover:text-white bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/40 px-2.5 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer active:scale-95"
          title="Refresh comments"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Post a Comment Form */}
      <form onSubmit={handleSubmit} className="bg-slate-950/70 border border-emerald-950 rounded-xl p-3.5 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Author Name */}
          <div className="flex items-center gap-1.5">
            <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Your nickname"
              className="bg-emerald-950/40 border border-emerald-900/40 rounded-lg px-2.5 py-1 text-xs font-bold text-emerald-200 outline-none focus:border-emerald-500 w-36 font-mono"
            />
          </div>

          {/* Tag Selector */}
          <div className="flex flex-wrap items-center gap-1">
            {TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(tag)}
                className={`text-[10px] font-mono font-bold px-2 py-1 rounded-md transition cursor-pointer ${
                  selectedTag === tag
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'bg-emerald-950/50 text-slate-400 hover:text-emerald-300 border border-emerald-900/30'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Comment Textarea */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={matchFixtureName ? `Add comment for ${matchFixtureName}...` : "Share a match update, banker prediction, or draw signal..."}
            className="flex-1 bg-slate-900/80 border border-emerald-950 focus:border-emerald-500 outline-none rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 font-sans"
          />
          <button
            type="submit"
            disabled={isSubmitting || !newComment.trim()}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md shrink-0 font-mono"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Post</span>
          </button>
        </div>
      </form>

      {/* Comment List */}
      <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs italic bg-emerald-950/10 rounded-xl border border-dashed border-emerald-950">
            No comments yet. Be the first to post a live reaction or draw banker tip!
          </div>
        ) : (
          comments.map((c) => {
            const hasLiked = likedMap[c.id];
            return (
              <div
                key={c.id}
                className="bg-slate-950/60 border border-emerald-950/60 hover:border-emerald-900/40 rounded-xl p-3 flex items-start justify-between gap-3 transition"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-emerald-400 font-mono">
                      {c.username || 'Pool Fan'}
                    </span>
                    {c.team_tag && (
                      <span className="text-[9.5px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-900/40">
                        {c.team_tag}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500 font-mono ml-auto sm:ml-0">
                      {formatTimeAgo(c.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans break-words">
                    {c.comment}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleLike(c.id)}
                  className={`flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-1 rounded-lg border transition cursor-pointer shrink-0 active:scale-90 ${
                    hasLiked
                      ? 'bg-rose-950/60 text-rose-400 border-rose-800/50'
                      : 'bg-emerald-950/30 text-slate-400 hover:text-rose-400 border-emerald-900/30 hover:border-rose-900/40'
                  }`}
                  title="Like comment"
                >
                  <Heart className={`w-3 h-3 ${hasLiked ? 'fill-rose-400 text-rose-400' : ''}`} />
                  <span>{c.likes || 0}</span>
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
