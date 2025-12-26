
import { Post } from '../types';

/**
 * Note: This file simulates Firebase Firestore and Storage operations.
 * In a real production setup, you would initialize Firebase:
 * import { initializeApp } from "firebase/app";
 * import { getFirestore, collection, addDoc, query, orderBy, onSnapshot } from "firebase/firestore";
 * import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
 */

// Local Storage based simulation for the demo environment
const STORAGE_KEY = 'sparkboard_posts_v1';

export const fetchPosts = (callback: (posts: Post[]) => void) => {
  const load = () => {
    const data = localStorage.getItem(STORAGE_KEY);
    const posts: Post[] = data ? JSON.parse(data) : [];
    callback(posts.sort((a, b) => b.createdAt - a.createdAt));
  };

  load();
  window.addEventListener('storage', load);
  return () => window.removeEventListener('storage', load);
};

export const createPost = async (
  nickname: string,
  content: string,
  imageFile: File | null
): Promise<Post> => {
  // Simulate image upload to Storage
  let imageUrl: string | undefined;
  if (imageFile) {
    imageUrl = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(imageFile);
    });
  }

  const newPost: Post = {
    id: Math.random().toString(36).substring(7),
    nickname: nickname.trim() || "匿名",
    content: content.trim(),
    imageUrl,
    createdAt: Date.now()
  };

  const existingData = localStorage.getItem(STORAGE_KEY);
  const posts: Post[] = existingData ? JSON.parse(existingData) : [];
  posts.push(newPost);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  
  // Trigger local event to update other tabs/components
  window.dispatchEvent(new Event('storage'));

  return newPost;
};
