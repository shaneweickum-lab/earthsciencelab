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
