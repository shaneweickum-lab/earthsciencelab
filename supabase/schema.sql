-- Earth Science Lab: cloud saves and teacher classes.
-- Paste this whole file into the Supabase SQL editor and run it once. It's safe to run again.
--
-- Teachers sign up with an email address. Students never give an email: the site's server
-- (app/api/students/*, using the service-role key) creates their account when they join a class
-- with the class's join code, and they sign in with the class code, their nickname, and three
-- login words.

-- ───────────────────────── tables ─────────────────────────

-- Six letters and digits that are easy to read aloud (no 0/O, 1/I/L).
create or replace function public.new_join_code() returns text
language sql volatile as $$
  select string_agg(substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + floor(random() * 31)::int, 1), '')
  from generate_series(1, 6);
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'teacher' check (role in ('teacher', 'student')),
  display_name text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  grade_level text not null default 'middle' check (grade_level in ('elementary', 'middle', 'high')),
  join_code text not null unique default public.new_join_code(),
  created_at timestamptz not null default now()
);

create table if not exists public.class_members (
  class_id uuid not null references public.classes (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 24),
  joined_at timestamptz not null default now(),
  primary key (class_id, student_id),
  unique (class_id, nickname)
);

-- One cloud save per person: the farm (the same JSON the game keeps in localStorage) and the
-- site's progress (XP, badges, grade level). The summary columns let teachers see progress
-- without downloading whole farms.
create table if not exists public.saves (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  world jsonb,
  progress jsonb,
  farm_day integer,
  coins integer,
  harvests integer,
  journal_pages integer,
  xp integer,
  updated_at timestamptz not null default now()
);

create index if not exists classes_teacher_idx on public.classes (teacher_id);
create index if not exists class_members_student_idx on public.class_members (student_id);

-- ───────────────────────── new accounts ─────────────────────────

-- Every new sign-up gets a profile. Students are created by the server with role 'student';
-- everyone who signs up on their own is a teacher.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, display_name)
  values (
    new.id,
    case when new.raw_app_meta_data ->> 'role' = 'student' then 'student' else 'teacher' end,
    coalesce(new.raw_user_meta_data ->> 'display_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────────────────── helpers for row-level security ─────────────────────────

-- True when the signed-in teacher has this student in one of their classes.
create or replace function public.teaches(student uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.class_members m join public.classes c on c.id = m.class_id
    where m.student_id = student and c.teacher_id = auth.uid()
  );
$$;

-- True when the signed-in student is in this class.
create or replace function public.in_class(class uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.class_members where class_id = class and student_id = auth.uid());
$$;

-- ───────────────────────── row-level security ─────────────────────────

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.class_members enable row level security;
alter table public.saves enable row level security;

drop policy if exists "read own profile or your students'" on public.profiles;
create policy "read own profile or your students'" on public.profiles for select
  using (id = auth.uid() or public.teaches(id));

drop policy if exists "rename yourself" on public.profiles;
create policy "rename yourself" on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());
-- Only the name can change; the role is set when the account is made.
revoke update on public.profiles from authenticated, anon;
grant update (display_name) on public.profiles to authenticated;

drop policy if exists "teachers manage their classes" on public.classes;
create policy "teachers manage their classes" on public.classes for all
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid() and exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher'));

drop policy if exists "students see their classes" on public.classes;
create policy "students see their classes" on public.classes for select
  using (public.in_class(id));

drop policy if exists "teachers see and remove their students" on public.class_members;
create policy "teachers see and remove their students" on public.class_members for select
  using (exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid()));
drop policy if exists "teachers remove students" on public.class_members;
create policy "teachers remove students" on public.class_members for delete
  using (exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid()));

drop policy if exists "students see their memberships" on public.class_members;
create policy "students see their memberships" on public.class_members for select
  using (student_id = auth.uid());
-- Joining a class happens on the server (it checks the join code and makes the account).

drop policy if exists "your own save" on public.saves;
create policy "your own save" on public.saves for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "teachers read their students' saves" on public.saves;
create policy "teachers read their students' saves" on public.saves for select
  using (public.teaches(user_id));

-- Teachers see progress through this view, which leaves out the big JSON columns.
create or replace view public.class_progress with (security_invoker = true) as
  select m.class_id, m.student_id, m.nickname, m.joined_at,
         s.farm_day, s.coins, s.harvests, s.journal_pages, s.xp, s.updated_at
  from public.class_members m
  left join public.saves s on s.user_id = m.student_id;

grant select on public.class_progress to authenticated;

-- ───────────────────────── multiplayer worlds ─────────────────────────

-- A shared farm town for up to 8 farmers. One farmer hosts: their browser runs the world and
-- keeps its snapshot here (`data`, at sequence number `seq`); the others join with the code.
create table if not exists public.worlds (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default ('FARM-' || public.new_join_code()),
  name text not null,
  host_id uuid not null references public.profiles (id) on delete cascade,
  host_name text not null default 'Farmer',
  data jsonb,
  seq integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.world_members (
  world_id uuid not null references public.worlds (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (world_id, user_id)
);

create index if not exists world_members_user_idx on public.world_members (user_id);

create or replace function public.in_world(w uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.world_members where world_id = w and user_id = auth.uid());
$$;

-- Start a world (you're its host and first member).
create or replace function public.create_world(p_name text) returns public.worlds
language plpgsql security definer set search_path = public as $$
declare
  w public.worlds;
begin
  if auth.uid() is null then raise exception 'sign in first'; end if;
  insert into public.worlds (name, host_id, host_name)
    values (left(coalesce(nullif(trim(p_name), ''), 'Our farm town'), 40), auth.uid(),
            coalesce((select display_name from public.profiles where id = auth.uid()), 'Farmer'))
    returning * into w;
  insert into public.world_members (world_id, user_id) values (w.id, auth.uid());
  return w;
end;
$$;

-- Join a world by its code (again is fine). Worlds hold 8 farmers.
create or replace function public.join_world(p_code text) returns public.worlds
language plpgsql security definer set search_path = public as $$
declare
  w public.worlds;
begin
  if auth.uid() is null then raise exception 'sign in first'; end if;
  select * into w from public.worlds where code = upper(trim(p_code));
  if not found then raise exception 'no such world'; end if;
  if not exists (select 1 from public.world_members where world_id = w.id and user_id = auth.uid()) then
    if (select count(*) from public.world_members where world_id = w.id) >= 8 then raise exception 'world is full'; end if;
    insert into public.world_members (world_id, user_id) values (w.id, auth.uid());
  end if;
  return w;
end;
$$;

alter table public.worlds enable row level security;
alter table public.world_members enable row level security;

drop policy if exists "members see their worlds" on public.worlds;
create policy "members see their worlds" on public.worlds for select
  using (public.in_world(id));
drop policy if exists "the host saves the world" on public.worlds;
create policy "the host saves the world" on public.worlds for update
  using (host_id = auth.uid()) with check (host_id = auth.uid());
drop policy if exists "the host deletes the world" on public.worlds;
create policy "the host deletes the world" on public.worlds for delete
  using (host_id = auth.uid());

drop policy if exists "members see who's in their worlds" on public.world_members;
create policy "members see who's in their worlds" on public.world_members for select
  using (public.in_world(world_id));
drop policy if exists "leave a world" on public.world_members;
create policy "leave a world" on public.world_members for delete
  using (user_id = auth.uid());

grant execute on function public.create_world(text) to authenticated;
grant execute on function public.join_world(text) to authenticated;

-- Realtime: only a world's members may use its channel ("world:<id>", private).
create or replace function public.in_world_topic(topic text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.world_members
    where world_id::text = split_part(topic, ':', 2) and user_id = auth.uid()
  );
$$;

drop policy if exists "world members listen" on realtime.messages;
create policy "world members listen" on realtime.messages for select to authenticated
  using (realtime.topic() like 'world:%' and public.in_world_topic(realtime.topic()));
drop policy if exists "world members talk" on realtime.messages;
create policy "world members talk" on realtime.messages for insert to authenticated
  with check (realtime.topic() like 'world:%' and public.in_world_topic(realtime.topic()));
