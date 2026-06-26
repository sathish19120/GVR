-- GVR branch stock deduction support
-- Run this in Supabase SQL Editor before deploying the updated files.

alter table orders
add column if not exists branch text;

alter table orders
add column if not exists order_type text;

alter table orders
add column if not exists pickup_branch text;

alter table orders
add column if not exists pickup_time text;

alter table orders
add column if not exists stock_deducted boolean not null default false;

alter table orders
add column if not exists stock_deducted_at timestamp with time zone;

alter table orders
add column if not exists stock_deducted_note text;

update orders
set branch = coalesce(pickup_branch, branch, 'Hyderabad')
where branch is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'branch_stock_branch_product_key'
  ) then
    alter table branch_stock
    add constraint branch_stock_branch_product_key unique (branch_name, product_id);
  end if;
end $$;

insert into branch_stock (
  branch_name,
  product_id,
  product_name,
  stock_bags,
  updated_at
)
select
  b.branch_name,
  p.id,
  p.name,
  0,
  now()
from unnest(array[
  'Hyderabad',
  'Vijayawada',
  'Kadapa',
  'Anantapur',
  'Tadipatri',
  'Jammalamadugu'
]) as b(branch_name)
cross join products p
where p.active = true
on conflict (branch_name, product_id) do nothing;
