-- Remember a Day: Surprise Studio schema
-- Run this in Supabase SQL Editor. Then create a PUBLIC Storage bucket named
-- surprise-media (or use the bucket name configured in js/supabase-config.js).
-- Public links are bearer links: anyone with the link can view the surprise.
-- Do not store highly sensitive/private content here.

create table if not exists public.surprises (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('card','giftbox','memory')),
  title text not null default 'A little surprise',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

alter table public.surprises enable row level security;

-- Anonymous creation is enabled for this starter implementation.
-- For a public app launch, add rate limiting / CAPTCHA or authenticated ownership.
create policy "Anyone can create a surprise"
on public.surprises for insert to anon, authenticated
with check (jsonb_typeof(payload) = 'object');

create policy "Anyone can read non-expired surprises"
on public.surprises for select to anon, authenticated
using (expires_at is null or expires_at > now());

-- Storage bucket policies for media uploads.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('surprise-media', 'surprise-media', true, 10485760,
        array['image/jpeg','image/png','image/webp','audio/mpeg','audio/mp4'])
on conflict (id) do update set public = true;

create policy "Anyone can upload surprise media"
on storage.objects for insert to anon, authenticated
with check (bucket_id = 'surprise-media');

create policy "Anyone can view surprise media"
on storage.objects for select to anon, authenticated
using (bucket_id = 'surprise-media');
