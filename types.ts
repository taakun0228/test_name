
export interface Post {
  id: string;
  nickname: string;
  content: string;
  imageUrl?: string;
  createdAt: number;
}

export interface PostFormData {
  nickname: string;
  content: string;
  image: File | null;
}

export enum PostStatus {
  IDLE = 'idle',
  UPLOADING = 'uploading',
  SUCCESS = 'success',
  ERROR = 'error'
}
