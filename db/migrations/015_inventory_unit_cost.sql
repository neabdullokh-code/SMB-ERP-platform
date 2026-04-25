alter table inventory_items add column if not exists unit_cost_uzs numeric(14,2) not null default 0;
