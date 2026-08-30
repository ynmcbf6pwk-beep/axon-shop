create table if not exists public.axon_store (
  id text primary key default 'main',
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.axon_store enable row level security;

create policy "Public can read Axon store"
  on public.axon_store for select
  using (true);

create policy "Server role can manage Axon store"
  on public.axon_store for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
