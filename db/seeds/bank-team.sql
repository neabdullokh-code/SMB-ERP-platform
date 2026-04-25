-- Bank portal: Bank team

insert into users (id, full_name, email, phone)
values
  ('00000000-0000-0000-0000-000000000301', 'Aziza Karimova', 'aziza.k@sqb.uz', '+998901000301'),
  ('00000000-0000-0000-0000-000000000302', 'Rustam Mahmudov', 'rustam.m@sqb.uz', '+998901000302'),
  ('00000000-0000-0000-0000-000000000303', 'Shahnoza Rahimova', 'shahnoza.r@sqb.uz', '+998901000303'),
  ('00000000-0000-0000-0000-000000000304', 'Timur Abdullaev', 'timur.a@sqb.uz', '+998901000304'),
  ('00000000-0000-0000-0000-000000000305', 'Laylo Mirzaeva', 'laylo.m@sqb.uz', '+998901000305')
on conflict (id) do update
set full_name = excluded.full_name,
    email = excluded.email,
    phone = excluded.phone;
