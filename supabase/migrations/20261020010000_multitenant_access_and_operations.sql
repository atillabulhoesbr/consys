create extension if not exists btree_gist with schema extensions;

alter table public.profiles drop constraint profiles_id_fkey;
alter table public.profiles
  add constraint profiles_id_fkey
  foreign key (id) references auth.users (id) on delete cascade;

alter table public.tenants
  add column app_code text generated always as (slug || '@consys.com') stored;
create unique index tenants_app_code_idx on public.tenants (app_code);

create type public.registration_status as enum ('pending', 'approved', 'rejected');
create type public.charge_status as enum ('open', 'paid');
create type public.reservation_status as enum ('pending', 'approved', 'rejected', 'cancelled');
create type public.ticket_status as enum ('open', 'in_progress', 'resolved');
create type public.ticket_category as enum ('maintenance', 'noise', 'question', 'other');
create type public.announcement_category as enum ('general', 'maintenance', 'assembly', 'conviviality');
create type public.announcement_priority as enum ('normal', 'urgent');

create table public.resident_registrations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  user_id uuid not null references public.profiles (id) on delete restrict,
  full_name text not null check (char_length(btrim(full_name)) between 2 and 120),
  email text not null check (char_length(btrim(email)) between 3 and 254),
  status public.registration_status not null default 'pending',
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id) on delete restrict,
  unit_code text check (unit_code is null or char_length(btrim(unit_code)) between 1 and 32),
  unique (tenant_id, id)
);

create unique index resident_registrations_pending_email_idx
  on public.resident_registrations (tenant_id, lower(email))
  where status = 'pending';

create table public.amenity_reservations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  unit_id uuid not null,
  requested_by uuid not null references public.profiles (id) on delete restrict,
  space_name text not null check (char_length(btrim(space_name)) between 2 and 100),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  guest_count integer not null default 0 check (guest_count between 0 and 200),
  status public.reservation_status not null default 'pending',
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  foreign key (tenant_id, unit_id)
    references public.units (tenant_id, id) on delete restrict
);

alter table public.amenity_reservations
  add constraint amenity_reservations_no_overlap
  exclude using gist (
    tenant_id with =,
    space_name with =,
    tstzrange(starts_at, ends_at, '[)') with &&
  ) where (status in ('pending', 'approved'));

create index amenity_reservations_tenant_start_idx
  on public.amenity_reservations (tenant_id, starts_at);

create table public.condominium_charges (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  unit_id uuid not null,
  description text not null check (char_length(btrim(description)) between 1 and 160),
  competence text not null check (char_length(btrim(competence)) between 1 and 40),
  due_date date not null,
  amount_cents integer not null check (amount_cents > 0),
  status public.charge_status not null default 'open',
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (tenant_id, unit_id)
    references public.units (tenant_id, id) on delete restrict,
  check ((status = 'open' and paid_at is null) or (status = 'paid' and paid_at is not null))
);

create index condominium_charges_tenant_unit_due_idx
  on public.condominium_charges (tenant_id, unit_id, due_date desc);

create table public.condominium_tickets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete restrict,
  unit_id uuid not null,
  opened_by uuid not null references public.profiles (id) on delete restrict,
  category public.ticket_category not null,
  title text not null check (char_length(btrim(title)) between 2 and 160),
  description text not null check (char_length(btrim(description)) between 2 and 5000),
  status public.ticket_status not null default 'open',
  response text check (response is null or char_length(response) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (tenant_id, unit_id)
    references public.units (tenant_id, id) on delete restrict
);

create index condominium_tickets_tenant_created_idx
  on public.condominium_tickets (tenant_id, created_at desc);

alter table public.announcements
  add constraint announcements_tenant_id_unique unique (tenant_id, id),
  add column category public.announcement_category not null default 'general',
  add column priority public.announcement_priority not null default 'normal',
  add column pinned boolean not null default false,
  add column poll_question text,
  add column poll_options jsonb,
  add constraint announcements_poll_shape check (
    (poll_question is null and poll_options is null)
    or (
      char_length(btrim(poll_question)) between 1 and 500
      and jsonb_typeof(poll_options) = 'array'
      and jsonb_array_length(poll_options) between 2 and 8
    )
  );

create table public.announcement_votes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  announcement_id uuid not null references public.announcements (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete restrict,
  option_index smallint not null check (option_index between 0 and 7),
  created_at timestamptz not null default now(),
  unique (announcement_id, user_id),
  foreign key (tenant_id, announcement_id)
    references public.announcements (tenant_id, id) on delete cascade
);

create index announcement_votes_tenant_idx
  on public.announcement_votes (tenant_id, announcement_id);

create or replace function private.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.platform_roles pr
    where pr.user_id = (select auth.uid())
      and pr.role = 'super_admin'
  );
$$;

create or replace function private.has_tenant_role(
  target_tenant_id uuid,
  allowed_roles public.tenant_role[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tenant_memberships tm
    join public.tenants t on t.id = tm.tenant_id
    where tm.tenant_id = target_tenant_id
      and tm.user_id = (select auth.uid())
      and tm.status = 'active'
      and t.status = 'active'
      and tm.role = any(allowed_roles)
  );
$$;

create or replace function private.can_access_unit(
  target_tenant_id uuid,
  target_unit_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_platform_admin()
    or private.has_tenant_role(target_tenant_id, array['condominium_admin']::public.tenant_role[])
    or exists (
      select 1
      from public.unit_residents ur
      join public.residents r
        on r.tenant_id = ur.tenant_id and r.id = ur.resident_id
      where ur.tenant_id = target_tenant_id
        and ur.unit_id = target_unit_id
        and ur.status = 'active'
        and r.profile_id = (select auth.uid())
        and r.status = 'active'
    );
$$;

create or replace function private.can_manage_tenant(target_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_platform_admin()
    or private.has_tenant_role(target_tenant_id, array['condominium_admin']::public.tenant_role[]);
$$;

revoke all on function private.is_platform_admin() from public, anon;
revoke all on function private.has_tenant_role(uuid, public.tenant_role[]) from public, anon;
revoke all on function private.can_access_unit(uuid, uuid) from public, anon;
revoke all on function private.can_manage_tenant(uuid) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_platform_admin() to authenticated;
grant execute on function private.has_tenant_role(uuid, public.tenant_role[]) to authenticated;
grant execute on function private.can_access_unit(uuid, uuid) to authenticated;
grant execute on function private.can_manage_tenant(uuid) to authenticated;

create or replace function private.set_review_metadata()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    new.reviewed_at = pg_catalog.now();
    new.reviewed_by = (select auth.uid());
  end if;
  return new;
end;
$$;

create or replace function private.create_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(
      nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(pg_catalog.split_part(coalesce(new.email, ''), '@', 1), ''),
      'Usuário'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function private.create_profile_for_auth_user() from public, anon, authenticated;
create trigger auth_user_profile_created
  after insert on auth.users
  for each row execute function private.create_profile_for_auth_user();

create or replace function public.provision_tenant(
  target_name text,
  target_slug text,
  manager_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_tenant_id uuid;
begin
  if coalesce((select auth.role()), '') <> 'service_role' then
    raise exception 'Operação restrita ao provisionamento seguro.';
  end if;
  if char_length(pg_catalog.btrim(target_name)) < 2
    or target_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    or target_slug in ('admin', 'api', 'app', '_next')
    or not exists (select 1 from public.profiles p where p.id = manager_user_id) then
    raise exception 'Dados inválidos para criar o condomínio.';
  end if;

  insert into public.tenants (name, slug)
  values (pg_catalog.btrim(target_name), target_slug)
  returning id into new_tenant_id;

  insert into public.condominiums (tenant_id, name)
  values (new_tenant_id, pg_catalog.btrim(target_name));

  insert into public.tenant_memberships (tenant_id, user_id, role, status)
  values (new_tenant_id, manager_user_id, 'condominium_admin', 'active');

  return new_tenant_id;
end;
$$;

revoke all on function public.provision_tenant(text, text, uuid) from public, anon, authenticated;
grant execute on function public.provision_tenant(text, text, uuid) to service_role;

create or replace function public.grant_initial_platform_admin(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(7463819204);
  if (coalesce((select auth.role()), '') <> 'service_role'
    or exists (select 1 from public.platform_roles)) then
    raise exception 'Bootstrap do administrador global indisponível.';
  end if;
  if not exists (select 1 from public.profiles p where p.id = target_user_id) then
    raise exception 'Perfil do administrador não encontrado.';
  end if;
  insert into public.platform_roles (user_id, role)
  values (target_user_id, 'super_admin');
end;
$$;

revoke all on function public.grant_initial_platform_admin(uuid) from public, anon, authenticated;
grant execute on function public.grant_initial_platform_admin(uuid) to service_role;

create or replace function public.approve_resident_registration(
  target_tenant_id uuid,
  target_registration_id uuid,
  target_unit_code text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  registration public.resident_registrations%rowtype;
  target_condominium_id uuid;
  target_unit_id uuid;
  target_resident_id uuid;
begin
  if not private.can_manage_tenant(target_tenant_id) then
    raise exception 'Acesso negado.';
  end if;
  if char_length(pg_catalog.btrim(target_unit_code)) not between 1 and 32 then
    raise exception 'Informe uma unidade válida.';
  end if;

  select * into registration
  from public.resident_registrations rr
  where rr.id = target_registration_id
    and rr.tenant_id = target_tenant_id
    and rr.status = 'pending'
  for update;
  if not found then
    raise exception 'Solicitação indisponível.';
  end if;

  if exists (
    select 1 from public.tenant_memberships tm
    where tm.tenant_id = target_tenant_id
      and tm.user_id = registration.user_id
      and tm.role = 'condominium_admin'
  ) then
    raise exception 'A conta já possui papel administrativo neste condomínio.';
  end if;

  select c.id into target_condominium_id
  from public.condominiums c
  where c.tenant_id = target_tenant_id
  order by c.created_at
  limit 1;
  if target_condominium_id is null then
    raise exception 'Condomínio não configurado.';
  end if;

  insert into public.units (tenant_id, condominium_id, code, occupancy)
  values (target_tenant_id, target_condominium_id, pg_catalog.btrim(target_unit_code), 'occupied')
  on conflict (condominium_id, code)
  do update set occupancy = 'occupied'
  returning id into target_unit_id;

  insert into public.residents (tenant_id, profile_id, full_name, email)
  values (target_tenant_id, registration.user_id, registration.full_name, registration.email)
  on conflict (tenant_id, profile_id)
  do update set status = 'active'
  returning id into target_resident_id;

  insert into public.tenant_memberships (tenant_id, user_id, role, status)
  values (target_tenant_id, registration.user_id, 'resident', 'active')
  on conflict (tenant_id, user_id)
  do update set role = 'resident', status = 'active';

  insert into public.unit_residents (
    tenant_id, unit_id, resident_id, relationship, status, start_date
  )
  values (
    target_tenant_id, target_unit_id, target_resident_id, 'occupant', 'active',
    current_date
  )
  on conflict (unit_id, resident_id)
  do update set status = 'active', end_date = null;

  update auth.users
  set email_confirmed_at = coalesce(email_confirmed_at, pg_catalog.now())
  where id = registration.user_id;

  update public.resident_registrations
  set status = 'approved', unit_code = pg_catalog.btrim(target_unit_code)
  where id = target_registration_id;
end;
$$;

revoke all on function public.approve_resident_registration(uuid, uuid, text) from public, anon;
grant execute on function public.approve_resident_registration(uuid, uuid, text) to authenticated;

create or replace function public.get_announcement_vote_counts(
  target_tenant_id uuid,
  target_announcement_ids uuid[]
)
returns table (announcement_id uuid, option_index smallint, vote_count bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.has_tenant_role(
    target_tenant_id,
    array['condominium_admin', 'resident']::public.tenant_role[]
  ) then
    raise exception 'Acesso negado.';
  end if;
  return query
    select av.announcement_id, av.option_index, pg_catalog.count(*)::bigint
    from public.announcement_votes av
    join public.announcements a
      on a.id = av.announcement_id and a.tenant_id = av.tenant_id
    where av.tenant_id = target_tenant_id
      and av.announcement_id = any(target_announcement_ids)
      and a.status = 'published'
    group by av.announcement_id, av.option_index;
end;
$$;

revoke all on function public.get_announcement_vote_counts(uuid, uuid[]) from public, anon;
grant execute on function public.get_announcement_vote_counts(uuid, uuid[]) to authenticated;

create trigger resident_registrations_review_metadata
  before update on public.resident_registrations
  for each row execute function private.set_review_metadata();

create trigger condominium_tickets_set_updated_at
  before update on public.condominium_tickets
  for each row execute function private.set_updated_at();

alter table public.resident_registrations enable row level security;
alter table public.amenity_reservations enable row level security;
alter table public.condominium_charges enable row level security;
alter table public.condominium_tickets enable row level security;
alter table public.announcement_votes enable row level security;

create policy "active tenants are discoverable"
  on public.tenants for select to anon, authenticated
  using (status = 'active');
create policy "platform administrators manage tenants"
  on public.tenants for all to authenticated
  using (private.is_platform_admin())
  with check (private.is_platform_admin());

create policy "users read own profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or private.is_platform_admin());
create policy "users update own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));
create policy "platform administrators read profiles"
  on public.profiles for select to authenticated
  using (private.is_platform_admin());

create policy "platform administrators manage platform roles"
  on public.platform_roles for all to authenticated
  using (private.is_platform_admin())
  with check (private.is_platform_admin());

create policy "members read relevant memberships"
  on public.tenant_memberships for select to authenticated
  using (
    user_id = (select auth.uid())
    or private.can_manage_tenant(tenant_id)
  );
create policy "managers manage tenant memberships"
  on public.tenant_memberships for all to authenticated
  using (private.can_manage_tenant(tenant_id))
  with check (private.can_manage_tenant(tenant_id));

create policy "tenant members read condominiums"
  on public.condominiums for select to authenticated
  using (private.has_tenant_role(
    tenant_id,
    array['condominium_admin', 'resident']::public.tenant_role[]
  ));
create policy "managers manage condominiums"
  on public.condominiums for all to authenticated
  using (private.can_manage_tenant(tenant_id))
  with check (private.can_manage_tenant(tenant_id));

create policy "tenant members read blocks"
  on public.blocks for select to authenticated
  using (private.has_tenant_role(
    tenant_id,
    array['condominium_admin', 'resident']::public.tenant_role[]
  ));
create policy "managers manage blocks"
  on public.blocks for all to authenticated
  using (private.can_manage_tenant(tenant_id))
  with check (private.can_manage_tenant(tenant_id));

create policy "tenant members read units"
  on public.units for select to authenticated
  using (private.has_tenant_role(
    tenant_id,
    array['condominium_admin', 'resident']::public.tenant_role[]
  ));
create policy "managers manage units"
  on public.units for all to authenticated
  using (private.can_manage_tenant(tenant_id))
  with check (private.can_manage_tenant(tenant_id));

create policy "tenant members read residents"
  on public.residents for select to authenticated
  using (
    private.can_manage_tenant(tenant_id)
    or profile_id = (select auth.uid())
  );
create policy "managers manage residents"
  on public.residents for all to authenticated
  using (private.can_manage_tenant(tenant_id))
  with check (private.can_manage_tenant(tenant_id));

create policy "unit residents read own links"
  on public.unit_residents for select to authenticated
  using (
    private.can_manage_tenant(tenant_id)
    or exists (
      select 1 from public.residents r
      where r.tenant_id = unit_residents.tenant_id
        and r.id = unit_residents.resident_id
        and r.profile_id = (select auth.uid())
    )
  );
create policy "managers manage unit residents"
  on public.unit_residents for all to authenticated
  using (private.can_manage_tenant(tenant_id))
  with check (private.can_manage_tenant(tenant_id));

create policy "residents read published announcements"
  on public.announcements for select to authenticated
  using (
    status = 'published'
    and private.has_tenant_role(
      tenant_id,
      array['condominium_admin', 'resident']::public.tenant_role[]
    )
  );
create policy "managers manage announcements"
  on public.announcements for all to authenticated
  using (private.can_manage_tenant(tenant_id))
  with check (
    private.can_manage_tenant(tenant_id)
    and author_id = (select auth.uid())
  );

create policy "residents create registration requests"
  on public.resident_registrations for insert to authenticated
  with check (
    status = 'pending'
    and user_id = (select auth.uid())
    and lower(email) = lower(coalesce((select auth.jwt()) ->> 'email', ''))
    and exists (
      select 1 from public.tenants t
      where t.id = resident_registrations.tenant_id and t.status = 'active'
    )
  );
create policy "managers review registrations"
  on public.resident_registrations for all to authenticated
  using (private.can_manage_tenant(tenant_id))
  with check (private.can_manage_tenant(tenant_id));

create policy "users read accessible charges"
  on public.condominium_charges for select to authenticated
  using (private.can_access_unit(tenant_id, unit_id));
create policy "managers create charges"
  on public.condominium_charges for insert to authenticated
  with check (private.can_manage_tenant(tenant_id));
create policy "managers update charges"
  on public.condominium_charges for update to authenticated
  using (private.can_manage_tenant(tenant_id))
  with check (private.can_manage_tenant(tenant_id));

create policy "users read accessible reservations"
  on public.amenity_reservations for select to authenticated
  using (
    private.can_manage_tenant(tenant_id)
    or (requested_by = (select auth.uid()) and private.can_access_unit(tenant_id, unit_id))
  );
create policy "residents request own reservations"
  on public.amenity_reservations for insert to authenticated
  with check (
    requested_by = (select auth.uid())
    and status = 'pending'
    and private.can_access_unit(tenant_id, unit_id)
  );
create policy "managers manage reservations"
  on public.amenity_reservations for update to authenticated
  using (private.can_manage_tenant(tenant_id))
  with check (private.can_manage_tenant(tenant_id));

create policy "users read accessible tickets"
  on public.condominium_tickets for select to authenticated
  using (
    private.can_manage_tenant(tenant_id)
    or (opened_by = (select auth.uid()) and private.can_access_unit(tenant_id, unit_id))
  );
create policy "residents create own tickets"
  on public.condominium_tickets for insert to authenticated
  with check (
    opened_by = (select auth.uid())
    and status = 'open'
    and response is null
    and private.can_access_unit(tenant_id, unit_id)
  );
create policy "managers respond to tickets"
  on public.condominium_tickets for update to authenticated
  using (private.can_manage_tenant(tenant_id))
  with check (private.can_manage_tenant(tenant_id));

create policy "users read only their own votes"
  on public.announcement_votes for select to authenticated
  using (user_id = (select auth.uid()));
create policy "residents vote once in published polls"
  on public.announcement_votes for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.announcements a
      where a.id = announcement_votes.announcement_id
        and a.tenant_id = announcement_votes.tenant_id
        and a.status = 'published'
        and a.poll_options is not null
        and option_index < jsonb_array_length(a.poll_options)
    )
    and private.has_tenant_role(
      tenant_id,
      array['resident']::public.tenant_role[]
    )
  );

grant select on public.tenants to anon, authenticated;
grant select, insert, update, delete on
  public.profiles, public.platform_roles, public.tenant_memberships,
  public.condominiums, public.blocks, public.units, public.residents,
  public.unit_residents, public.announcements, public.resident_registrations,
  public.amenity_reservations, public.condominium_charges,
  public.condominium_tickets, public.announcement_votes
to authenticated;

revoke all on public.invitations from anon, authenticated;
