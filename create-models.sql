create table if not exists users (
  id integer not null primary key,
  title text not null,
  supervisor_id integer null references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index supervisor_id_idx on users (supervisor_id);

create type RESOURCE_TYPE as enum ('storage', 'project');

-- 资源
create table if not exists resources (
  id integer not null primary key,
  name text not null,
  resource_type RESOURCE_TYPE not null,
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

create index resource_id_idx on access_lists (resource_id);

create or replace function check_acl (user_id integer, resource_id integer)
returns ACCESS_TYPE AS $$
  with recursive all_subordinates(id) as (
      select id from users where id = $1
    union
      select u.id
      from all_subordinates as c inner join users as u on u.supervisor_id = c.id
  )
  select a.access_type
  from all_subordinates as u
  inner join access_lists as a on a.user_id = u.id
  inner join resources as r on a.resource_id = r.id
  where r.id = $2;
$$ LANGUAGE sql immutable strict;
