
-- Roles enum and table
create type public.app_role as enum ('admin', 'user');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- Trigger to create profile + role on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email);
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Clients
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text,
  company text,
  phone text,
  address text,
  created_at timestamptz not null default now()
);

-- Expenses
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null,
  category text not null,
  description text,
  expense_date date not null default current_date,
  receipt_url text,
  created_at timestamptz not null default now()
);

-- Invoices
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  invoice_number text not null,
  status text not null default 'draft',
  issue_date date not null default current_date,
  due_date date,
  subtotal numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  amount numeric(12,2) not null default 0
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.clients enable row level security;
alter table public.expenses enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;

-- Profiles policies
create policy "Users view own profile" on public.profiles for select using (auth.uid() = id or public.has_role(auth.uid(), 'admin'));
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Admins manage profiles" on public.profiles for all using (public.has_role(auth.uid(), 'admin'));

-- User roles policies
create policy "Users view own roles" on public.user_roles for select using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage roles" on public.user_roles for all using (public.has_role(auth.uid(), 'admin'));

-- Clients
create policy "Users manage own clients" on public.clients for all using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin')) with check (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

-- Expenses
create policy "Users manage own expenses" on public.expenses for all using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin')) with check (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

-- Invoices
create policy "Users manage own invoices" on public.invoices for all using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin')) with check (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

-- Invoice items (via parent invoice)
create policy "Users manage own invoice items" on public.invoice_items for all
using (exists (select 1 from public.invoices i where i.id = invoice_id and (i.user_id = auth.uid() or public.has_role(auth.uid(), 'admin'))))
with check (exists (select 1 from public.invoices i where i.id = invoice_id and (i.user_id = auth.uid() or public.has_role(auth.uid(), 'admin'))));
