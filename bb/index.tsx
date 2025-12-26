
import { GoogleGenAI } from "@google/genai";

// --- Constants & Config ---
const STORAGE_KEY = 'sparkboard_data_v1';
const COOLDOWN_TIME = 30000; // 30秒の連続投稿制限
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

// --- State ---
let posts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

// --- DOM Elements ---
const postForm = document.getElementById('post-form') as HTMLFormElement;
const postsContainer = document.getElementById('posts-container')!;
const nicknameInput = document.getElementById('nickname') as HTMLInputElement;
const contentInput = document.getElementById('content') as HTMLTextAreaElement;
const imageInput = document.getElementById('image-input') as HTMLInputElement;
const previewContainer = document.getElementById('preview-container')!;
const imagePreview = document.getElementById('image-preview') as HTMLImageElement;
const removeImageBtn = document.getElementById('remove-image-btn')!;
const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
const postCountEl = document.getElementById('post-count')!;
const formError = document.getElementById('form-error')!;
const errorMessageText = document.getElementById('error-message-text')!;
const aiSummarySection = document.getElementById('ai-summary-section')!;
const aiSummaryText = document.getElementById('ai-summary-text')!;
const refreshSummaryBtn = document.getElementById('refresh-summary-btn')!;
const imageModal = document.getElementById('image-modal')!;
const modalImg = document.getElementById('modal-img') as HTMLImageElement;
const closeModalBtn = document.getElementById('close-modal')!;

// --- Helpers ---
const sanitize = (str: string) => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
};

const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('ja-JP', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(new Date(timestamp));
};

// --- Core Logic ---

// AI要約の取得
async function updateSummary() {
    if (posts.length === 0) return;
    
    aiSummarySection.classList.remove('hidden');
    aiSummaryText.textContent = "要約を生成中...";
    
    try {
        const textToSummarize = posts.slice(0, 10)
            .map((p: any) => `${p.nickname}: ${p.content}`)
            .join("\n---\n");

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `以下の掲示板の最新投稿を2-3文で優しく要約してください。：\n\n${textToSummarize}`,
            config: {
                systemInstruction: "あなたは掲示板の管理人です。ユーザーが掲示板の雰囲気をすぐ掴めるように要約してください。",
            }
        });
        aiSummaryText.textContent = response.text || "要約を取得できませんでした。";
    } catch (err) {
        console.error(err);
        aiSummaryText.textContent = "AI要約は現在利用できません。";
    }
}

// 投稿内容のセーフティチェック
async function isContentSafe(content: string) {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `内容が不適切（誹謗中傷、過激な暴力、違法行為の助長）か判定してください。JSON: {"safe": boolean, "reason": "string"} \n内容: ${content}`,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || '{"safe": true}');
    } catch (err) {
        return { safe: true };
    }
}

// 投稿の描画
function renderPosts() {
    postsContainer.innerHTML = '';
    postCountEl.textContent = `${posts.length} Posts`;

    if (posts.length === 0) {
        postsContainer.innerHTML = `
            <div class="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                <p class="text-slate-500 font-medium">投稿がまだありません。<br>最初のメッセージを書いてみましょう！</p>
            </div>`;
        return;
    }

    posts.sort((a: any, b: any) => b.createdAt - a.createdAt).forEach((post: any) => {
        const postEl = document.createElement('div');
        postEl.className = 'bg-white rounded-xl border border-slate-200 p-5 mb-4 post-fade-in';
        postEl.innerHTML = `
            <div class="flex justify-between items-start mb-3 border-b border-slate-50 pb-2">
                <div class="flex items-center gap-2">
                    <span class="font-bold text-indigo-700">${sanitize(post.nickname)}</span>
                    <span class="text-xs text-slate-400">•</span>
                    <span class="text-xs text-slate-500 font-medium">${formatDate(post.createdAt)}</span>
                </div>
                <span class="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">ID: ${post.id}</span>
            </div>
            <div class="text-slate-700 whitespace-pre-wrap break-words leading-relaxed">${sanitize(post.content)}</div>
            ${post.imageUrl ? `
                <div class="mt-4 overflow-hidden rounded-lg border border-slate-100 group">
                    <img src="${post.imageUrl}" alt="Uploaded Image" class="max-h-80 w-auto object-contain cursor-pointer transition-transform hover:scale-[1.02]" onclick="window.openModal('${post.imageUrl}')">
                </div>
            ` : ''}
        `;
        postsContainer.appendChild(postEl);
    });
}

// --- Event Handlers ---

// 画像選択
imageInput.addEventListener('change', (e: any) => {
    const file = e.target.files[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) {
            alert("画像サイズは5MB以内にする必要があります。");
            imageInput.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = (event: any) => {
            imagePreview.src = event.target.result;
            previewContainer.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
});

// 画像削除
removeImageBtn.addEventListener('click', () => {
    imageInput.value = '';
    imagePreview.src = '';
    previewContainer.classList.add('hidden');
});

// 投稿送信
postForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.classList.add('hidden');

    const nickname = nicknameInput.value.trim() || "匿名";
    const content = contentInput.value.trim();

    // バリデーション
    if (!content) return;

    // 連続投稿制限
    const lastPost = localStorage.getItem('last_post_at');
    if (lastPost && Date.now() - parseInt(lastPost) < COOLDOWN_TIME) {
        const remaining = Math.ceil((COOLDOWN_TIME - (Date.now() - parseInt(lastPost))) / 1000);
        errorMessageText.textContent = `連続投稿は制限されています。あと ${remaining} 秒お待ちください。`;
        formError.classList.remove('hidden');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "送信中...";

    try {
        // AI Safety Check
        const safety = await isContentSafe(content);
        if (!safety.safe) {
            errorMessageText.textContent = `不適切な内容が含まれています: ${safety.reason}`;
            formError.classList.remove('hidden');
            submitBtn.disabled = false;
            submitBtn.textContent = "投稿する";
            return;
        }

        const newPost = {
            id: Math.random().toString(36).substring(7),
            nickname,
            content,
            imageUrl: imagePreview.src || null,
            createdAt: Date.now()
        };

        posts.push(newPost);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
        localStorage.setItem('last_post_at', Date.now().toString());

        // リセット
        postForm.reset();
        previewContainer.classList.add('hidden');
        imagePreview.src = '';
        
        renderPosts();
        updateSummary();

        submitBtn.textContent = "投稿完了！";
        setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = "投稿する";
        }, 2000);

    } catch (err) {
        errorMessageText.textContent = "エラーが発生しました。再度お試しください。";
        formError.classList.remove('hidden');
        submitBtn.disabled = false;
        submitBtn.textContent = "投稿する";
    }
});

// 要約リフレッシュ
refreshSummaryBtn.addEventListener('click', updateSummary);

// モーダル制御
(window as any).openModal = (url: string) => {
    modalImg.src = url;
    imageModal.classList.remove('hidden');
    setTimeout(() => imageModal.classList.add('opacity-100'), 10);
};

const closeModal = () => {
    imageModal.classList.add('hidden');
    modalImg.src = '';
};

closeModalBtn.addEventListener('click', closeModal);
imageModal.addEventListener('click', (e) => {
    if (e.target === imageModal) closeModal();
});

// --- Initial Render ---
renderPosts();
if (posts.length > 0) updateSummary();
