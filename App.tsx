
import React, { useState, useEffect } from 'react';
import { Post } from './types';
import PostForm from './components/PostForm';
import PostItem from './components/PostItem';
import ImageModal from './components/ImageModal';
import { fetchPosts } from './services/firebaseService';
import { getBoardSummary } from './services/geminiService';

const App: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = fetchPosts((newPosts) => {
      setPosts(newPosts);
    });
    return () => unsubscribe();
  }, []);

  const handleRefreshSummary = async () => {
    if (posts.length === 0) return;
    setIsSummaryLoading(true);
    const text = await getBoardSummary(posts);
    setSummary(text);
    setIsSummaryLoading(false);
  };

  // Auto-generate summary on first significant load
  useEffect(() => {
    if (posts.length > 0 && !summary) {
      handleRefreshSummary();
    }
  }, [posts.length]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">SparkBoard</h1>
          </div>
          <div className="text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider">
            {posts.length} Posts
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Gemini AI Summary Section */}
        {posts.length > 0 && (
          <div className="mb-8 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white shadow-xl shadow-indigo-200/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-100" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                </span>
                <h3 className="font-bold text-lg">AI Board Summary</h3>
              </div>
              <button 
                onClick={handleRefreshSummary}
                disabled={isSummaryLoading}
                className="hover:bg-white/10 p-1.5 rounded-full transition-colors disabled:opacity-50"
                title="Refresh summary"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isSummaryLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            <p className="text-indigo-100 text-sm leading-relaxed min-h-[3rem]">
              {isSummaryLoading ? "要約を生成中..." : summary || "最新の要約を取得中..."}
            </p>
          </div>
        )}

        <PostForm onSuccess={() => {}} />

        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-bold text-slate-700">最近の投稿</h2>
            <div className="h-[2px] flex-1 bg-slate-200 rounded-full"></div>
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
              <div className="text-slate-300 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-slate-500 font-medium">投稿がまだありません。<br/>最初のメッセージを書いてみましょう！</p>
            </div>
          ) : (
            posts.map((post) => (
              <PostItem 
                key={post.id} 
                post={post} 
                onImageClick={setSelectedImage} 
              />
            ))
          )}
        </div>
      </main>

      {/* Footer Info / Instructions */}
      <footer className="max-w-3xl mx-auto px-4 mt-8 pb-12 border-t border-slate-200 pt-8">
        <div className="bg-slate-100 rounded-xl p-5 text-sm text-slate-600 space-y-3">
          <h4 className="font-bold text-slate-800">🚀 Firebase設定手順 (簡易版)</h4>
          <ol className="list-decimal ml-5 space-y-1">
            <li>Firebase Consoleでプロジェクトを作成します。</li>
            <li>Firestore Databaseを有効化し、テストモード（または認証なし公開ルール）で開始します。</li>
            <li>Storageを有効化し、画像保存を許可するルールを設定します。</li>
            <li>プロジェクト設定からWebアプリを追加し、Firebase SDK設定情報を取得します。</li>
            <li><code>services/firebaseService.ts</code> を実際のSDK呼び出しに書き換えます。</li>
          </ol>
          <p className="text-xs text-slate-400 mt-4 italic">
            ※ このデモ版はLocalStorageで動作しており、データはご利用のブラウザにのみ保存されます。
          </p>
        </div>
      </footer>

      <ImageModal 
        url={selectedImage} 
        onClose={() => setSelectedImage(null)} 
      />
    </div>
  );
};

export default App;
