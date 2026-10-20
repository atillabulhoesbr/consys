create type public.tenant_status as enum ('active', 'suspended');
create type public.tenant_role as enum ('condominium_admin', 'resident');
create type public.membership_status as enum ('invited', 'active', 'inactive');
create type public.occupancy_status as enum ('vacant', 'occupied', 'under_maintenance');
create type public.resident_status as enum ('active', 'inactive');
create type public.unit_relationship as enum ('owner', 'tenant', 'occupant');
create type public.announcement_status as enum ('draft', 'published');
create type public.invitation_status as enum ('pending', 'accepted', 'revoked', 'expired');

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete restrict,
  full_name text not null check (char_length(btrim(full_name)) > 0),
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.platform_roles (
  user_id uuid primary key references public.profiles (id) on delete restrict,
  role text not null check (role = 'super_admin'),
  created_at timestamptz not null default now()
);

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  status public.tenant_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tenant_memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete restrict,
  role public.tenant_role not null,
  status public.membership_status not null default 'invited',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, user_id),
  unique (tenant_id, id)
);

create index tenant_memberships_user_status_idx
  on public.tenant_memberships (user_id, status);

create table public.condominiums (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  name text not null check (char_length(btrim(name)) > 0),
  cnpj text,
  address text,
  city text,
  state text check (state is null or state ~ '^[A-Z]{2}$'),
  postal_code text,
  contact_phone text,
  contact_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id)
);

create index condominiums_tenant_idx on public.condominiums (tenant_id);

create table public.blocks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  condominium_id uuid not null,
  name text not null check (char_length(btrim(name)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, condominium_id, name),
  unique (tenant_id, condominium_id, id),
  foreign key (tenant_id, condominium_id)
    references public.condominiums (tenant_id, id) on delete restrict
);

create index blocks_condominium_idx
  on public.blocks (tenant_id, condominium_id);

create table public.units (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  condominium_id uuid not null,
  block_id uuid,
  code text not null check (char_length(btrim(code)) > 0),
  occupancy public.occupancy_status not null default 'vacant',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (condominium_id, code),
  foreign key (tenant_id, condominium_id)
    references public.condominiums (tenant_id, id) on delete restrict,
  foreign key (tenant_id, condominium_id, block_id)
    references public.blocks (tenant_id, condominium_id, id) on delete restrict
);

create index units_condominium_occupancy_idx
  on public.units (tenant_id, condominium_id, occupancy);

create table public.residents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  profile_id uuid references public.profiles (id) on delete restrict,
  full_name text not null check (char_length(btrim(full_name)) > 0),
  email text,
  phone text,
  status public.resident_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, profile_id)
);

create index residents_tenant_name_idx
  on public.residents (tenant_id, full_name);

create table public.unit_residents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  unit_id uuid not null,
  resident_id uuid not null,
  relationship public.unit_relationship not null,
  status public.resident_status not null default 'active',
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (unit_id, resident_id),
  check (end_date is null or start_date is null or end_date >= start_date),
  foreign key (tenant_id, unit_id)
    references public.units (tenant_id, id) on delete restrict,
  foreign key (tenant_id, resident_id)
    references public.residents (tenant_id, id) on delete restrict
);

create index unit_residents_unit_status_idx
  on public.unit_residents (unit_id, status);
create index unit_residents_resident_idx
  on public.unit_residents (tenant_id, resident_id);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  condominium_id uuid not null,
  author_id uuid not null references public.profiles (id) on delete restrict,
  title text not null check (char_length(btrim(title)) > 0),
  content text not null check (char_length(btrim(content)) > 0),
  status public.announcement_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status = 'draft' and published_at is null)
    or (status = 'published' and published_at is not null)
  ),
  foreign key (tenant_id, condominium_id)
    references public.condominiums (tenant_id, id) on delete restrict
);

create index announcements_feed_idx
  on public.announcements (tenant_id, condominium_id, published_at desc)
  where status = 'published';

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  email text not null check (char_length(btrim(email)) > 0),
  role public.tenant_role not null,
  token_hash text not null unique,
  status public.invitation_status not null default 'pending',
  invited_by uuid not null references public.profiles (id) on delete restrict,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index invitations_tenant_status_idx
  on public.invitations (tenant_id, status);
create unique index invitations_pending_email_idx
  on public.invitations (tenant_id, lower(email))
  where status = 'pending';

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();
create trigger tenants_set_updated_at
  before update on public.tenants
  for each row execute function private.set_updated_at();
create trigger tenant_memberships_set_updated_at
  before update on public.tenant_memberships
  for each row execute function private.set_updated_at();
create trigger condominiums_set_updated_at
  before update on public.condominiums
  for each row execute function private.set_updated_at();
create trigger blocks_set_updated_at
  before update on public.blocks
  for each row execute function private.set_updated_at();
create trigger units_set_updated_at
  before update on public.units
  for each row execute function private.set_updated_at();
create trigger residents_set_updated_at
  before update on public.residents
  for each row execute function private.set_updated_at();
create trigger unit_residents_set_updated_at
  before update on public.unit_residents
  for each row execute function private.set_updated_at();
create trigger announcements_set_updated_at
  before update on public.announcements
  for each row execute function private.set_updated_at();
create trigger invitations_set_updated_at
  before update on public.invitations
  for each row execute function private.set_updated_at();

alter table public.profiles enable row level security;
alter table public.platform_roles enable row level security;
alter table public.tenants enable row level security;
alter table public.tenant_memberships enable row level security;
alter table public.condominiums enable row level security;
alter table public.blocks enable row level security;
alter table public.units enable row level security;
alter table public.residents enable row level security;
alter table public.unit_residents enable row level security;
alter table public.announcements enable row level security;
alter table public.invitations enable row level security;
