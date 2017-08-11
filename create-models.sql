
-- 用户
create table if not exists users (
  id serial not null primary key,
  user_id text not null unique,
  is_active boolean not null default 'true',
  supervisor_id integer null references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index supervisor_id_index on users (supervisor_id);

create type RESOURCE_TYPE as enum ('storage', 'experiment');

-- 资源
create table if not exists resources (
  id serial not null primary key,
  resource_id text not null unique,
  resource_type RESOURCE_TYPE not null,
  is_active boolean not null default 'true',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type ACCESS_TYPE as enum ('read', 'write', 'admin');

-- 权限
create table if not exists access_lists (
  user_id integer not null references users (id) on delete cascade,
  resource_id integer not null references resources (id) on delete cascade,
  access_type ACCESS_TYPE not null default 'read',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, resource_id)
);

create or replace view users_and_resources as
  select u.id as uid, u.user_id, r.id as rid, r.resource_id, r.resource_type, a.access_type
  from users as u
  inner join access_lists as a on u.id = a.user_id
  inner join resources as r on r.id = a.resource_id
  where u.is_active = 'true' and r.is_active = 'true';

create or replace view users_and_direct_reports as
  select u1.id as id,
         u1.user_id as user_id,
         u2.id as direct_report_id,
         u2.user_id as direct_report_user_id
  from users as u1 inner join users as u2 on u1.id = u2.supervisor_id
  where u1.is_active = 'true' and u2.is_active = 'true';

create or replace view users_and_all_team as
  with recursive find_children(id) as (
    select u.id, u.user_id, u.supervisor_id
    from users as u
    where u.is_active = 'true' and u.supervisor_id = id
    union
    select u.id, u.user_id, u.supervisor_id
    from find_children as f join users as u
    on u.supervisor_id = f.id
    where u.is_active = 'true'
  ) select * from find_children;
