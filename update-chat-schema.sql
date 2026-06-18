-- ============================================================
-- InstaSearch - Create chat_messages table (Transient Public Chats)
-- Run this SQL in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

create table if not exists chat_messages (
  id uuid default gen_random_uuid() primary key,
  room text not null, -- 'all', 'hindi', 'telugu', 'tamil', 'kannada', 'malayalam'
  message text not null,
  sender_name text not null,
  sender_id text not null,
  created_at timestamptz default now()
);

-- Performance Indexes
create index if not exists idx_chat_messages_room on chat_messages(room);
create index if not exists idx_chat_messages_created_at on chat_messages(created_at desc);

-- Enable Row Level Security (RLS)
alter table chat_messages enable row level security;

-- Public Select Policy
create policy "Public read chat messages" 
  on chat_messages for select 
  using (true);

-- Public Insert Policy
create policy "Public insert chat messages" 
  on chat_messages for insert 
  with check (true);

-- Public Delete Policy (needed for cleanup on the client/API)
create policy "Public delete chat messages" 
  on chat_messages for delete 
  using (true);
