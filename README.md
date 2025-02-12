# ResearchTool

A Next.js-based research paper management system built on a TypeScript/React stack. The application provides PDF processing capabilities, document management, and a Supabase-backed persistence layer.

## Core Functionality

### Document Processing
- PDF rendering and manipulation via `react-pdf` and `pdf-lib`
- Client-side annotation system using `react-pdf-highlighter`
- Document metadata extraction and indexing
- Full-text search implementation

### Application Architecture
- Server-side rendering with Next.js App Router
- React Server Components for optimal performance
- Type-safe database operations via Supabase client
- Custom hooks for state management
- Responsive layouts using CSS Grid/Flexbox

### Data Layer
- Supabase PostgreSQL database
- Real-time subscriptions for collaborative features
- Row Level Security (RLS) policies
- TypeScript interfaces for all database entities

## Technical Stack

```typescript
{
  "frontend": {
    "framework": "Next.js 15.1.4",
    "runtime": "React 19.0.0",
    "language": "TypeScript 5.x",
    "styling": "TailwindCSS 3.4.1"
  },
  "backend": {
    "database": "Supabase PostgreSQL",
    "auth": "Supabase Auth",
    "storage": "Supabase Storage"
  },
  "ui": {
    "components": "Radix UI primitives",
    "theming": "CSS Variables + Tailwind",
    "animations": "Framer Motion"
  }
}
```

## Project Structure
```
src/
├── app/                    # Next.js routes and layouts
│   ├── api/               # API route handlers
│   ├── paper/             # Paper viewing routes
│   └── category/          # Category management
├── components/            
│   ├── pdf/              # PDF processing components
│   │   ├── viewer.tsx    # PDF rendering
│   │   └── highlighter.tsx # Annotation system
│   ├── library/          # Document management
│   └── ui/               # Shared components
├── lib/
│   ├── supabase/         # Database client & types
│   └── utils/            # Shared utilities
└── types/                # TypeScript definitions
```

## Development Setup

1. **Dependencies**
   ```bash
   node -v  # Requires Node.js 18+
   npm install
   ```

2. **Environment Configuration**
   ```bash
   # .env.local
   NEXT_PUBLIC_SUPABASE_URL=<url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<key>
   ```

3. **Development Server**
   ```bash
   npm run dev  # Runs on :3001 with --turbopack
   ```

4. **Production Build**
   ```bash
   npm run build
   npm start
   ```

## Database Schema

```sql
-- Core tables
papers (
  id uuid primary key,
  title text not null,
  authors jsonb,
  pdf_url text,
  metadata jsonb,
  created_at timestamptz
)

annotations (
  id uuid primary key,
  paper_id uuid references papers,
  content jsonb,
  page_number integer,
  created_by uuid references auth.users
)

categories (
  id uuid primary key,
  name text not null,
  parent_id uuid references categories
)
```

## Performance Considerations

- PDF rendering optimized with virtualization
- Lazy loading of document content
- Incremental static regeneration for static pages
- Edge caching for API routes
- Optimistic updates for real-time operations

## Testing and Quality

```bash
npm run lint     # ESLint + TypeScript
npm run test     # Jest + React Testing Library
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request with:
   - Clear description of changes
   - Updated tests if needed
   - TypeScript types maintained

## License

MIT License - See LICENSE file

---

For detailed API documentation, see `/docs`

## Current Features

- AI-powered paper recommendations based on user interests
- Intelligent paper categorization and topic extraction
- Impact score prediction using citation analysis
- Personalized reading lists and libraries
- Dark mode optimized reading experience

## Upcoming Features

- ArXiv integration for real-time paper ingestion
- Automated paper indexing and metadata extraction
- Enhanced semantic search capabilities
- Citation network analysis and visualization
- Collaborative reading lists and annotations
- PDF parsing and full-text search
- Research trend analysis and predictions

## Development Setup

First, install dependencies and start the development server:
