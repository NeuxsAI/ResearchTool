-- Enable necessary extensions
create extension if not exists "vector" with schema public;

-- Create tables
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  color text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) on delete cascade not null
);

create table if not exists papers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  authors text[] not null,
  year integer,
  abstract text,
  pdf_url text,
  category_id uuid references categories(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  embedding vector(1536)
);

create table if not exists annotations (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  page_number integer,
  highlight_text text,
  paper_id uuid references papers(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) on delete cascade not null
);

create table if not exists boards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) on delete cascade not null
);

create table if not exists board_items (
  id uuid primary key default gen_random_uuid(),
  board_id uuid references boards(id) on delete cascade not null,
  paper_id uuid references papers(id) on delete cascade not null,
  position_x integer not null,
  position_y integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) on delete cascade not null
);

create table if not exists reading_list (
  id uuid primary key default gen_random_uuid(),
  paper_id uuid references papers(id) on delete cascade not null,
  added_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  unique(user_id, paper_id)
);

create table if not exists discovered_papers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  authors text[] not null,
  abstract text,
  year integer,
  url text,
  citations integer default 0,
  impact text check (impact in ('high', 'low')),
  topics text[],
  source text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  metadata jsonb,
  user_id uuid references auth.users(id) on delete cascade not null
);

-- Create indexes
create index if not exists papers_category_id_idx on papers(category_id);
create index if not exists annotations_paper_id_idx on annotations(paper_id);
create index if not exists board_items_board_id_idx on board_items(board_id);
create index if not exists board_items_paper_id_idx on board_items(paper_id);
create index if not exists reading_list_paper_id_idx on reading_list(paper_id);
create index if not exists reading_list_user_paper_idx on reading_list(user_id, paper_id);
create index if not exists discovered_papers_user_id_idx on discovered_papers(user_id);

-- Enable Row Level Security (RLS)
alter table categories enable row level security;
alter table papers enable row level security;
alter table annotations enable row level security;
alter table boards enable row level security;
alter table board_items enable row level security;
alter table reading_list enable row level security;
alter table discovered_papers enable row level security;

-- Create RLS policies
create policy "Users can view their own categories"
  on categories for select
  using (auth.uid() = user_id);

create policy "Users can insert their own categories"
  on categories for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own categories"
  on categories for update
  using (auth.uid() = user_id);

create policy "Users can delete their own categories"
  on categories for delete
  using (auth.uid() = user_id);

-- Similar policies for other tables
create policy "Users can view their own papers"
  on papers for select
  using (auth.uid() = user_id);

create policy "Users can insert their own papers"
  on papers for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own papers"
  on papers for update
  using (auth.uid() = user_id);

create policy "Users can delete their own papers"
  on papers for delete
  using (auth.uid() = user_id);

-- Create functions
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.categories (name, description, color, user_id)
  values ('Research Papers', 'Default category for research papers', '#2563eb', new.id);
  return new;
end;
$$ language plpgsql security definer;

-- Create triggers
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Discovered papers policies
create policy "Users can view their own discovered papers"
  on discovered_papers for select
  using (auth.uid() = user_id);

create policy "Users can insert their own discovered papers"
  on discovered_papers for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own discovered papers"
  on discovered_papers for update
  using (auth.uid() = user_id);

create policy "Users can delete their own discovered papers"
  on discovered_papers for delete
  using (auth.uid() = user_id); 