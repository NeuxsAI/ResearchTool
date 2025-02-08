export const routes = {
  home: "/main",
  recent: "/recent",
  readingList: "/reading-list",
  discover: "/discover",
  category: {
    index: "/category",
    view: (slug: string) => `/category/${encodeURIComponent(slug)}`,
    new: "/category/new",
  },
  paper: {
    view: (id: string) => `/paper/${encodeURIComponent(id)}`,
  },
  canvas: {
    view: (id: string) => `/canvas/${encodeURIComponent(id)}`,
    new: (categoryId: string) => `/category/${encodeURIComponent(categoryId)}/canvas/new`,
  },
} as const;

export type AppRoutes = typeof routes; 