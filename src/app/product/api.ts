import { Injectable, signal } from '@angular/core';
export interface User {
  id: number;
  name: string;
  email: string;
}
export interface Member {
  id: number;
  name: string;
  email?: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  status: 'active' | 'suspended';
}
export interface Space {
  id: number;
  name: string;
  description: string;
  archived: number;
}
export interface Plan {
  name: string;
  price: number;
  members: number;
  spaces: number;
}
export interface Workspace {
  id: number;
  name: string;
  tagline: string;
  accent: string;
  role: Member['role'];
  plan: string;
  limits: Plan;
  plans: Record<string, Plan>;
  spaces: Space[];
  members: Member[];
  counts: { members: number; posts: number; reports: number };
}
export interface Comment {
  id: number;
  body: string;
  author: string;
  user_id: number;
  created: string;
}
export interface Post {
  id: number;
  body: string;
  author: string;
  user_id: number;
  space_id: number;
  space_name: string;
  liked: number;
  likes: number;
  saved: number;
  hidden: number;
  created: string;
  updated?: string;
  comments: Comment[];
  comment_count: number;
}
export interface Page<T> {
  items: T[];
  hasMore: boolean;
  nextCursor?: number;
}
export interface Conversation {
  id: number;
  starred: number;
  unread: number;
  people: { id: number; name: string; status: string }[];
  last: { id: number; body: string; created: string } | null;
}
export interface Message {
  duration?: number;
  waveform?: number[];
  id: number;
  body: string;
  user_id: number;
  author: string;
  created: string;
}
@Injectable({ providedIn: 'root' })
export class Api {
  user = signal<User | null>(null);
  async call<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
    let response: Response;
    try {
      response = await fetch('/api/' + path, {
        method,
        credentials: 'same-origin',
        headers:
          body === undefined ? {} : { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new Error(
        'Cannot connect to Gather. Check your connection and try again.',
      );
    }
    const data = await response
      .json()
      .catch(() => ({
        message: 'The server returned an unexpected response.',
      }));
    if (!response.ok) {
      if (response.status === 401) this.user.set(null);
      throw new Error(
        Array.isArray(data.message)
          ? data.message.join(' ')
          : data.message || 'Something went wrong. Please try again.',
      );
    }
    return data as T;
  }
  async me() {
    const user = await this.call<User>('auth/me');
    this.user.set(user);
    return user;
  }
  async logout() {
    await this.call('auth/logout', 'POST');
    this.user.set(null);
  }
}
