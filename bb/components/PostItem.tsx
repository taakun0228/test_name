
import React from 'react';
import { Post } from '../types';

interface PostItemProps {
  post: Post;
  onImageClick: (url: string) => void;
}

const PostItem: React.FC<PostItemProps> = ({ post, onImageClick }) => {
  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date(timestamp));
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex justify-between items-start mb-3 border-b border-slate-50 pb-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-indigo-700">{post.nickname}</span>
          <span className="text-xs text-slate-400">•</span>
          <span className="text-xs text-slate-500 font-medium">{formatDate(post.createdAt)}</span>
        </div>
        <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">ID: {post.id}</span>
      </div>
      
      <div className="text-slate-700 whitespace-pre-wrap break-words leading-relaxed">
        {post.content}
      </div>

      {post.imageUrl && (
        <div className="mt-4 overflow-hidden rounded-lg border border-slate-100 group">
          <img
            src={post.imageUrl}
            alt="投稿画像"
            onClick={() => onImageClick(post.imageUrl!)}
            className="max-h-80 w-auto object-contain cursor-pointer transition-transform group-hover:scale-[1.02]"
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
};

export default PostItem;
