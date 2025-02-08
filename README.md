# Research Paper Discovery Platform

A Next.js-based web application powered by AI for intelligent academic paper discovery and management. Built with React Server Components, TypeScript, and Tailwind CSS.

## Technical Stack

- **Framework**: Next.js 14 with App Router
- **UI Components**: Custom components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom dark theme configuration
- **Icons**: Lucide React for consistent iconography
- **Layout**: CSS Grid and Flexbox with responsive breakpoints
- **State Management**: React Hooks and Context API
- **AI Integration**: OpenAI API for paper recommendations and analysis
- **Database**: Supabase for paper storage and user data

## Architecture

The application follows a component-based architecture with:
- Shared UI components in `components/ui`
- Layout components in `components/layout`
- Feature-specific components in respective feature directories
- Client-side components marked with "use client" directive
- Server-side rendering for optimal performance
- AI recommendation engine for personalized paper suggestions
- Vector embeddings for semantic paper similarity

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
