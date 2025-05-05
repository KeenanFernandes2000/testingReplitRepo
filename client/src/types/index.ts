// Application-specific types

import { User } from "@shared/schema";

export interface Vlog {
  id: number;
  title: string;
  description: string;
  youtubeId: string;
  thumbnailUrl: string;
  duration: string;
  createdAt: string;
  expiresAt: string;
  likes: number;
  hasLiked: boolean;
  comments: Comment[];
  tags: string[];
  user: User;
}

export interface Comment {
  id: number;
  content: string;
  createdAt: string;
  user: User;
}

export interface FollowRelation {
  followerId: number;
  followingId: number;
  createdAt: string;
}
