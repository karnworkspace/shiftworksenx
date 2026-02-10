-- Supabase (PostgreSQL) init script for this project
-- Target decisions:
-- - IDs: UUID (gen_random_uuid())
-- - Money-like numbers: NUMERIC(12,2)
--
-- How to use:
-- 1) Open Supabase Dashboard -> SQL Editor
-- 2) Paste this entire file and run
--
-- Note about Prisma:
-- - Your current Prisma schema uses cuid() + Float.
-- - If you run this SQL (uuid + numeric), you should also update Prisma schema to use:
--   - String @db.Uuid @default(uuid()) for ids
--   - Decimal @db.Decimal(12,2) for numeric columns

begin;

-- 1) Extensions
create extension if not exists "pgcrypto";

-- 2) Enums (match Prisma enum names exactly)
do $$ begin
  create type "UserRole" as enum ('SUPER_ADMIN','AREA_MANAGER','SITE_MANAGER');
exception when duplicate_object then null; end $$;

do $$ begin
  create type "StaffType" as enum ('REGULAR','SPARE');
exception when duplicate_object then null; end $$;

do $$ begin
  create type "StaffAvailability" as enum ('AVAILABLE','TEMPORARILY_OFF','ON_LEAVE');
exception when duplicate_object then null; end $$;

-- 3) Tables

-- users
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password text not null,
  name text not null,
  role "UserRole" not null default 'SITE_MANAGER',
  permissions text[] not null default array['reports','roster','staff','projects']::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text,
  theme_color text not null default '#3b82f6',
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  manager_id uuid,
  constraint projects_manager_fkey foreign key (manager_id) references public.users(id)
);
do $$ begin
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='manager_id') then
    execute 'create index if not exists projects_manager_id_idx on public.projects(manager_id)';
  elsif exists(select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='"managerId"') then
    execute 'create index if not exists projects_manager_id_idx on public.projects("managerId")';
  end if;
end $$;

-- Ensure projects has a primary key on id if table existed previously without one
do $$ begin
  if not exists (
    select 1 from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public' and t.relname = 'projects' and c.contype = 'p'
  ) then
    if exists(select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='id') then
      begin
        execute 'alter table public.projects add primary key (id)';
      exception when duplicate_table then null; end;
    end if;
  end if;
end $$;

-- cost_sharing
create table if not exists public.cost_sharing (
  id uuid primary key default gen_random_uuid(),
  percentage numeric(12,2) not null check (percentage >= 0 and percentage <= 100),
  source_project_id uuid not null,
  destination_project_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cost_sharing_unique unique (source_project_id,destination_project_id)
);
do $$ begin
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='cost_sharing' and column_name='source_project_id') then
    execute 'create index if not exists cost_sharing_source_project_id_idx on public.cost_sharing(source_project_id)';
  elsif exists(select 1 from information_schema.columns where table_schema='public' and table_name='cost_sharing' and column_name='"sourceProjectId"') then
    execute 'create index if not exists cost_sharing_source_project_id_idx on public.cost_sharing("sourceProjectId")';
  end if;
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='cost_sharing' and column_name='destination_project_id') then
    execute 'create index if not exists cost_sharing_destination_project_id_idx on public.cost_sharing(destination_project_id)';
  elsif exists(select 1 from information_schema.columns where table_schema='public' and table_name='cost_sharing' and column_name='"destinationProjectId"') then
    execute 'create index if not exists cost_sharing_destination_project_id_idx on public.cost_sharing("destinationProjectId")';
  end if;
end $$;

-- staff
create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  position text not null,
  phone text,
  wage_per_day numeric(12,2) not null,
  staff_type "StaffType" not null default 'REGULAR',
  code text not null default 'Code 1',
  is_active boolean not null default true,
  availability "StaffAvailability" not null default 'AVAILABLE',
  default_shift text default 'OFF',
  remark text,
  project_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
  -- foreign key to projects will be added conditionally below (type-compatibility checked)
);
do $$ begin
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='staff' and column_name='project_id') then
    execute 'create index if not exists staff_project_id_idx on public.staff(project_id)';
  elsif exists(select 1 from information_schema.columns where table_schema='public' and table_name='staff' and column_name='"projectId"') then
    execute 'create index if not exists staff_project_id_idx on public.staff("projectId")';
  end if;
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='staff' and column_name='is_active') then
    execute 'create index if not exists staff_is_active_idx on public.staff(is_active)';
  elsif exists(select 1 from information_schema.columns where table_schema='public' and table_name='staff' and column_name='"isActive"') then
    execute 'create index if not exists staff_is_active_idx on public.staff("isActive")';
  end if;
end $$;

-- shift_types
create table if not exists public.shift_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  start_time text,
  end_time text,
  color text not null default '#3b82f6',
  is_work_shift boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- rosters
create table if not exists public.rosters (
  id uuid primary key default gen_random_uuid(),
  year int not null,
  month int not null check (month between 1 and 12),
  project_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rosters_unique unique (project_id, year, month)
);
do $$ begin
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='rosters' and column_name='project_id') then
    execute 'create index if not exists rosters_project_year_month_idx on public.rosters(project_id, year, month)';
  elsif exists(select 1 from information_schema.columns where table_schema='public' and table_name='rosters' and column_name='"projectId"') then
    execute 'create index if not exists rosters_project_year_month_idx on public.rosters("projectId", year, month)';
  end if;
end $$;

-- roster_entries
create table if not exists public.roster_entries (
  id uuid primary key default gen_random_uuid(),
  day int not null check (day between 1 and 31),
  shift_code text not null,
  notes text,
  roster_id uuid not null,
  staff_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint roster_entries_unique unique (roster_id, staff_id, day)
);
do $$ begin
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='roster_entries' and column_name='roster_id') then
    execute 'create index if not exists roster_entries_roster_id_idx on public.roster_entries(roster_id)';
  elsif exists(select 1 from information_schema.columns where table_schema='public' and table_name='roster_entries' and column_name='"rosterId"') then
    execute 'create index if not exists roster_entries_roster_id_idx on public.roster_entries("rosterId")';
  end if;
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='roster_entries' and column_name='staff_id') then
    execute 'create index if not exists roster_entries_staff_id_idx on public.roster_entries(staff_id)';
  elsif exists(select 1 from information_schema.columns where table_schema='public' and table_name='roster_entries' and column_name='"staffId"') then
    execute 'create index if not exists roster_entries_staff_id_idx on public.roster_entries("staffId")';
  end if;
end $$;

-- monthly_attendance
create table if not exists public.monthly_attendance (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null,
  roster_id uuid not null,
  year int not null,
  month int not null check (month between 1 and 12),
  total_work_days int not null default 0,
  total_absent int not null default 0,
  total_sick_leave int not null default 0,
  total_personal_leave int not null default 0,
  total_vacation int not null default 0,
  total_late int not null default 0,
  deduction_amount numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint monthly_attendance_unique unique (staff_id, year, month)
);
do $$ begin
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='monthly_attendance' and column_name='roster_id') then
    execute 'create index if not exists monthly_attendance_roster_id_idx on public.monthly_attendance(roster_id)';
  elsif exists(select 1 from information_schema.columns where table_schema='public' and table_name='monthly_attendance' and column_name='"rosterId"') then
    execute 'create index if not exists monthly_attendance_roster_id_idx on public.monthly_attendance("rosterId")';
  end if;
end $$;

-- 4) Add foreign-key constraints conditionally (only when referenced column types match)
do $$ begin
  -- cost_sharing -> projects
  if (select data_type from information_schema.columns where table_schema='public' and table_name='cost_sharing' and column_name='source_project_id') = 'uuid'
     and (select data_type from information_schema.columns where table_schema='public' and table_name='projects' and column_name='id') = 'uuid' then
    begin
      execute 'alter table public.cost_sharing add constraint cost_sharing_source_fkey foreign key (source_project_id) references public.projects(id) on delete cascade';
    exception when duplicate_object then null; end;
  end if;
  if (select data_type from information_schema.columns where table_schema='public' and table_name='cost_sharing' and column_name='destination_project_id') = 'uuid'
     and (select data_type from information_schema.columns where table_schema='public' and table_name='projects' and column_name='id') = 'uuid' then
    begin
      execute 'alter table public.cost_sharing add constraint cost_sharing_destination_fkey foreign key (destination_project_id) references public.projects(id) on delete cascade';
    exception when duplicate_object then null; end;
  end if;

  -- staff -> projects
  if (select data_type from information_schema.columns where table_schema='public' and table_name='staff' and column_name='project_id') = 'uuid'
     and (select data_type from information_schema.columns where table_schema='public' and table_name='projects' and column_name='id') = 'uuid' then
    begin
      execute 'alter table public.staff add constraint staff_project_fkey foreign key (project_id) references public.projects(id) on delete cascade';
    exception when duplicate_object then null; end;
  end if;

  -- rosters -> projects
  if (select data_type from information_schema.columns where table_schema='public' and table_name='rosters' and column_name='project_id') = 'uuid'
     and (select data_type from information_schema.columns where table_schema='public' and table_name='projects' and column_name='id') = 'uuid' then
    begin
      execute 'alter table public.rosters add constraint rosters_project_fkey foreign key (project_id) references public.projects(id) on delete cascade';
    exception when duplicate_object then null; end;
  end if;

  -- roster_entries -> rosters, staff
  if (select data_type from information_schema.columns where table_schema='public' and table_name='roster_entries' and column_name='roster_id') = 'uuid'
     and (select data_type from information_schema.columns where table_schema='public' and table_name='rosters' and column_name='id') = 'uuid' then
    begin
      execute 'alter table public.roster_entries add constraint roster_entries_roster_fkey foreign key (roster_id) references public.rosters(id) on delete cascade';
    exception when duplicate_object then null; end;
  end if;
  if (select data_type from information_schema.columns where table_schema='public' and table_name='roster_entries' and column_name='staff_id') = 'uuid'
     and (select data_type from information_schema.columns where table_schema='public' and table_name='staff' and column_name='id') = 'uuid' then
    begin
      execute 'alter table public.roster_entries add constraint roster_entries_staff_fkey foreign key (staff_id) references public.staff(id) on delete cascade';
    exception when duplicate_object then null; end;
  end if;

  -- monthly_attendance -> rosters, staff
  if (select data_type from information_schema.columns where table_schema='public' and table_name='monthly_attendance' and column_name='roster_id') = 'uuid'
     and (select data_type from information_schema.columns where table_schema='public' and table_name='rosters' and column_name='id') = 'uuid' then
    begin
      execute 'alter table public.monthly_attendance add constraint monthly_attendance_roster_idx_fk foreign key (roster_id) references public.rosters(id) on delete cascade';
    exception when duplicate_object then null; end;
  end if;
  if (select data_type from information_schema.columns where table_schema='public' and table_name='monthly_attendance' and column_name='staff_id') = 'uuid'
     and (select data_type from information_schema.columns where table_schema='public' and table_name='staff' and column_name='id') = 'uuid' then
    begin
      execute 'alter table public.monthly_attendance add constraint monthly_attendance_staff_fk foreign key (staff_id) references public.staff(id) on delete cascade';
    exception when duplicate_object then null; end;
  end if;
end $$;

-- 5) updatedAt auto-touch (optional but useful)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$;

do $$ begin
  create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger cost_sharing_set_updated_at
  before update on public.cost_sharing
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger staff_set_updated_at
  before update on public.staff
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger shift_types_set_updated_at
  before update on public.shift_types
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger rosters_set_updated_at
  before update on public.rosters
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger roster_entries_set_updated_at
  before update on public.roster_entries
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger monthly_attendance_set_updated_at
  before update on public.monthly_attendance
  for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

commit;
