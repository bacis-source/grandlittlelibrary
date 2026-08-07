create table public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  generation_group_id uuid not null,
  noticing_id uuid not null references public.noticings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  generation_type text not null check (generation_type in ('choko_noticing','caption')),
  model_provider text not null check (char_length(model_provider) between 1 and 80),
  model_name text not null check (char_length(model_name) between 1 and 120),
  prompt_version text not null check (char_length(prompt_version) between 1 and 120),
  input_snapshot jsonb not null,
  generated_text text not null check (char_length(generated_text) between 1 and 5000),
  structured_output jsonb not null,
  confidence numeric not null check (confidence between 0 and 1),
  uncertainties jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.editorial_revisions (
  id uuid primary key default gen_random_uuid(),
  noticing_id uuid not null references public.noticings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  ai_generation_id uuid references public.ai_generations(id) on delete set null,
  revision_type text not null check (revision_type in ('caption','choko_noticing')),
  decision text not null check (decision in ('accepted','edited','rejected')),
  original_ai_text text,
  final_human_text text not null check (char_length(final_human_text) between 1 and 5000),
  feedback_reason text check (char_length(feedback_reason) <= 2000),
  feedback_categories text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index ai_generations_noticing_created_idx on public.ai_generations(noticing_id, created_at desc);
create index ai_generations_user_prompt_idx on public.ai_generations(user_id, prompt_version, created_at desc);
create index revisions_noticing_created_idx on public.editorial_revisions(noticing_id, created_at desc);
create index revisions_generation_idx on public.editorial_revisions(ai_generation_id);

create trigger ai_generations_owner before insert or update on public.ai_generations for each row execute function public.enforce_child_owner();
create trigger editorial_revisions_owner before insert or update on public.editorial_revisions for each row execute function public.enforce_child_owner();

alter table public.ai_generations enable row level security;
alter table public.editorial_revisions enable row level security;

create policy own_ai_generations_select on public.ai_generations for select using ((select auth.uid()) = user_id and exists(select 1 from public.noticings n where n.id=noticing_id and n.user_id=(select auth.uid())));
create policy own_ai_generations_insert on public.ai_generations for insert with check ((select auth.uid()) = user_id and exists(select 1 from public.noticings n where n.id=noticing_id and n.user_id=(select auth.uid())));
create policy own_ai_generations_delete on public.ai_generations for delete using ((select auth.uid()) = user_id and exists(select 1 from public.noticings n where n.id=noticing_id and n.user_id=(select auth.uid())));

create policy own_editorial_revisions_select on public.editorial_revisions for select using ((select auth.uid()) = user_id and exists(select 1 from public.noticings n where n.id=noticing_id and n.user_id=(select auth.uid())));
create policy own_editorial_revisions_insert on public.editorial_revisions for insert with check ((select auth.uid()) = user_id and exists(select 1 from public.noticings n where n.id=noticing_id and n.user_id=(select auth.uid())));

-- AI proposals and human learning evidence are append-only. No update policies are granted.
