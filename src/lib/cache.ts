import { Paper } from './types';

type CacheEntry<T> = {
  data: T;
  timestamp: number;
  expiresIn: number;
};

export interface ICache {
  get: (key: string) => any;
  set: (key: string, value: any) => void;
  delete: (key: string) => void;
}

export class Cache implements ICache {
  private static instance: Cache;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private timeouts: Map<string, NodeJS.Timeout> = new Map();
  private config: {
    expiresIn: number;
  };

  private constructor(config?: { expiresIn: number }) {
    this.config = {
      expiresIn: config?.expiresIn || 5 * 60 * 1000 // 5 minutes default
    };
  }

  static getInstance(): Cache {
    if (!Cache.instance) {
      Cache.instance = new Cache();
    }
    return Cache.instance;
  }

  set<T>(key: string, data: T, expiresIn: number = this.config.expiresIn): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.expiresIn) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidateAll(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

export const cache = Cache.getInstance();

// Cache keys
export const CACHE_KEYS = {
  PAPERS: 'papers',
  CATEGORIES: 'categories',
  READING_LIST: 'reading_list',
  TRENDING_PAPERS: 'trending_papers',
  RECOMMENDED_PAPERS: 'recommended_papers',
  RECENT_PAPERS: 'recent_papers',
  ANNOTATIONS: (paperId: string) => `annotations_${paperId}`,
} as const; 