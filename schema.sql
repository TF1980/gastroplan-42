-- Optionales Supabase-Schema für GastroPlan 4.2
create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null default 'Mitarbeiter',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists schedule_entries (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  location_id text not null,
  work_date date not null,
  kind text not null check (kind in ('shift', 'task')),
  start_time time,
  end_time time,
  title text not null,
  note text,
  created_at timestamptz not null default now()
);

alter table employees enable row level security;
alter table schedule_entries enable row level security;

-- Für einen ersten internen Test. Vor produktiver Nutzung bitte durch Benutzer-/Rollenregeln ersetzen.
create policy "temporary employees access" on employees for all using (true) with check (true);
create policy "temporary schedule access" on schedule_entries for all using (true) with check (true);
