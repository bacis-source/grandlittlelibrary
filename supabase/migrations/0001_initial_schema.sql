create extension if not exists pgcrypto;

create type public.noticing_status as enum ('draft','unreviewed','reviewed','ready','archived');
create type public.published_status as enum ('never_published','scheduled','published','retired');
create type public.asset_type as enum ('image','video','audio');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 120),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.noticings (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  title text check (char_length(title) <= 160), observation_text text check (char_length(observation_text) <= 5000), original_observation_text text check (char_length(original_observation_text) <= 5000),
  location_name text, latitude numeric check (latitude between -90 and 90), longitude numeric check (longitude between -180 and 180), captured_at timestamptz,
  season text, weather text, time_of_day text, light_condition text, environment_type text, mood text,
  status public.noticing_status not null default 'draft', is_favorite boolean not null default false, ready_for_editorial boolean not null default false,
  rights_confirmed boolean not null default true, rights_note text, published_status public.published_status not null default 'never_published',
  deleted_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.noticing_assets (
  id uuid primary key default gen_random_uuid(), noticing_id uuid not null references public.noticings(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade,
  asset_type public.asset_type not null, storage_bucket text not null, storage_path text not null unique, original_filename text not null, mime_type text not null,
  file_size_bytes bigint check (file_size_bytes >= 0), width integer check (width > 0), height integer check (height > 0), duration_seconds numeric check (duration_seconds >= 0),
  sort_order integer not null default 0, is_primary boolean not null default false, created_at timestamptz not null default now()
);
create unique index one_primary_asset_per_noticing on public.noticing_assets(noticing_id) where is_primary;
create table public.tags (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, name text not null check (char_length(name) between 1 and 60), normalized_name text not null check (char_length(normalized_name) between 1 and 60), created_at timestamptz not null default now(), unique(user_id, normalized_name));
create table public.noticing_tags (noticing_id uuid not null references public.noticings(id) on delete cascade, tag_id uuid not null references public.tags(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade, created_at timestamptz not null default now(), primary key(noticing_id, tag_id));
create table public.noticing_notes (id uuid primary key default gen_random_uuid(), noticing_id uuid not null references public.noticings(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade, note_type text not null, content text not null check (char_length(content) <= 20000), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.publication_records (id uuid primary key default gen_random_uuid(), noticing_id uuid not null references public.noticings(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade, platform text not null, platform_post_id text, published_at timestamptz, caption text, performance_data jsonb, created_at timestamptz not null default now());

create index noticings_user_created_idx on public.noticings(user_id, created_at desc);
create index noticings_user_workflow_idx on public.noticings(user_id, status, is_favorite, ready_for_editorial);
create index assets_noticing_idx on public.noticing_assets(noticing_id, sort_order);
create index notes_noticing_idx on public.noticing_notes(noticing_id, created_at);
create index publications_noticing_idx on public.publication_records(noticing_id, published_at desc);

create function public.set_updated_at() returns trigger language plpgsql set search_path = '' as $$ begin new.updated_at = now(); return new; end; $$;
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger noticings_updated before update on public.noticings for each row execute function public.set_updated_at();
create trigger notes_updated before update on public.noticing_notes for each row execute function public.set_updated_at();
create function public.protect_original_observation() returns trigger language plpgsql set search_path = '' as $$ begin if old.original_observation_text is not null and new.original_observation_text is distinct from old.original_observation_text then raise exception 'Original observation is immutable'; end if; return new; end; $$;
create trigger original_observation_immutable before update on public.noticings for each row execute function public.protect_original_observation();
create function public.create_profile() returns trigger language plpgsql security definer set search_path = '' as $$ begin insert into public.profiles(id,display_name) values(new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1))); return new; end; $$;
create trigger auth_user_profile after insert on auth.users for each row execute function public.create_profile();
create function public.enforce_child_owner() returns trigger language plpgsql set search_path = '' as $$ begin if not exists(select 1 from public.noticings n where n.id = new.noticing_id and n.user_id = new.user_id) then raise exception 'Child owner must match noticing owner'; end if; return new; end; $$;
create trigger assets_owner before insert or update on public.noticing_assets for each row execute function public.enforce_child_owner();
create trigger notes_owner before insert or update on public.noticing_notes for each row execute function public.enforce_child_owner();
create trigger publications_owner before insert or update on public.publication_records for each row execute function public.enforce_child_owner();
create trigger noticing_tags_owner before insert or update on public.noticing_tags for each row execute function public.enforce_child_owner();
