export type SourceItem = {
  id: string;
  title: string;
  source: string;
  date: string;
  url: string;
  summary: string;
  tags: string[];
  isScrapped: boolean;
  memo?: string;
  type?: 'issue' | 'source';
  organization?: string;
};

export type NewsItem = {
  id: string;
  title: string;
  source: string;
  publisher: string;
  date: string;
  url: string;
  summary: string;
  tags: string[];
  isScrapped: boolean;
  memo?: string;
  type?: 'news';
  keywords?: string[];
  imageUrl?: string;
};

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin' | 'superadmin';
};

export type VerificationCode = {
  email: string;
  code: string;
  createdAt: Date;
  expiresAt: Date;
  used: boolean;
}; 