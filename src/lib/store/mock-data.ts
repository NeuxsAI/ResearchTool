export interface Author {
  id: string;
  name: string;
  paperCount: number;
}

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  year: number;
  category: string;
  annotations: number;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  authors: Author[];
  papers: Paper[];
}

export interface SidebarCategory {
  id: string;
  name: string;
  count: number;
  color: string;
}

export const mockCategories: Category[] = [
  {
    id: "ml",
    name: "Machine Learning",
    description: "Collection of papers and articles spanning various subfields of machine learning, from foundational concepts to cutting-edge developments.",
    authors: [
      { id: "1", name: "John Doe", paperCount: 3 },
      { id: "2", name: "Jane Smith", paperCount: 2 },
    ],
    papers: [
      {
        id: "1",
        title: "Deep Learning: A Comprehensive Survey",
        authors: ["John Doe", "Jane Smith"],
        year: 2023,
        category: "Machine Learning",
        annotations: 2,
      },
    ],
  },
  {
    id: "cs",
    name: "Computer Science",
    description: "A collection of computer science research papers and articles.",
    authors: [],
    papers: [],
  },
  {
    id: "econ",
    name: "Economics",
    description: "Research papers in economics and financial systems.",
    authors: [],
    papers: [],
  },
  {
    id: "health",
    name: "Health",
    description: "Medical and healthcare research papers.",
    authors: [],
    papers: [],
  },
  {
    id: "bio",
    name: "Biology",
    description: "Research papers in biological sciences.",
    authors: [],
    papers: [],
  },
  {
    id: "llm",
    name: "LLMs",
    description: "Papers about Large Language Models and their applications.",
    authors: [],
    papers: [],
  },
  {
    id: "psych",
    name: "Psychology",
    description: "Research in psychology and behavioral sciences.",
    authors: [],
    papers: [],
  },
  {
    id: "ai",
    name: "AI",
    description: "Papers about artificial intelligence and its applications.",
    authors: [],
    papers: [],
  },
  {
    id: "web",
    name: "Web Development",
    description: "Research papers about web technologies and development.",
    authors: [],
    papers: [],
  },
  {
    id: "crypto",
    name: "Crypto",
    description: "Papers about cryptography and blockchain technology.",
    authors: [],
    papers: [],
  },
];

export const mockSidebarCategories: SidebarCategory[] = [
  { id: "cs", name: "Computer Science", count: 27, color: "blue" },
  { id: "econ", name: "Economics", count: 11, color: "purple" },
  { id: "ml", name: "Machine Learning", count: 34, color: "brown" },
  { id: "health", name: "Health", count: 8, color: "indigo" },
  { id: "bio", name: "Biology", count: 8, color: "green" },
  { id: "llm", name: "LLMs", count: 10, color: "orange" },
  { id: "psych", name: "Psychology", count: 18, color: "yellow" },
  { id: "ai", name: "AI", count: 9, color: "lime" },
  { id: "web", name: "Web Development", count: 12, color: "blue" },
  { id: "crypto", name: "Crypto", count: 0, color: "orange" },
]; 