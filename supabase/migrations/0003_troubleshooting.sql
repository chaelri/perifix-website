-- Troubleshooting CMS: devices, problems, feedback. Seeds the original
-- 9-device / 27-problem tree extracted from Troubleshooting.tsx so admins can
-- edit it from the database instead of code.

-- =============================================================================
-- devices — top-level catalog
-- =============================================================================
create table if not exists public.devices (
  id bigserial primary key,
  slug text not null unique,
  name text not null,
  category text not null check (category in ('input','output')),
  icon_name text not null,        -- lucide-react component name, e.g. 'Mouse'
  color_class text not null,      -- tailwind utility, e.g. 'bg-blue-500'
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists devices_category_idx on public.devices (category, display_order);

drop trigger if exists devices_touch_updated on public.devices;
create trigger devices_touch_updated
  before update on public.devices
  for each row execute function public.touch_updated_at();

-- =============================================================================
-- problems — children of devices, each carries an array of steps as jsonb
-- =============================================================================
create table if not exists public.problems (
  id bigserial primary key,
  device_id bigint not null references public.devices(id) on delete cascade,
  slug text not null,
  title text not null,
  severity text not null check (severity in ('common','moderate','rare')),
  steps jsonb not null,           -- [{ step, title, description, image }]
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(device_id, slug)
);

create index if not exists problems_device_idx on public.problems (device_id, display_order);
create index if not exists problems_severity_idx on public.problems (severity);

drop trigger if exists problems_touch_updated on public.problems;
create trigger problems_touch_updated
  before update on public.problems
  for each row execute function public.touch_updated_at();

-- =============================================================================
-- troubleshooting_feedback — thumbs-up/down events from students
-- =============================================================================
create table if not exists public.troubleshooting_feedback (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete set null,
  problem_id bigint references public.problems(id) on delete set null,
  device_slug text,
  problem_slug text,
  helpful boolean not null,
  created_at timestamptz not null default now()
);

create index if not exists feedback_created_idx on public.troubleshooting_feedback (created_at desc);
create index if not exists feedback_helpful_idx on public.troubleshooting_feedback (helpful);
create index if not exists feedback_device_slug_idx on public.troubleshooting_feedback (device_slug);

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.devices enable row level security;
alter table public.problems enable row level security;
alter table public.troubleshooting_feedback enable row level security;

-- Anyone (incl. anonymous) can read devices & problems.
drop policy if exists devices_select_all on public.devices;
create policy devices_select_all on public.devices for select using (true);

drop policy if exists problems_select_all on public.problems;
create policy problems_select_all on public.problems for select using (true);

-- Only admins can write.
drop policy if exists devices_admin_write on public.devices;
create policy devices_admin_write on public.devices
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists problems_admin_write on public.problems;
create policy problems_admin_write on public.problems
  for all using (public.is_admin()) with check (public.is_admin());

-- Anyone can submit feedback; only admins can read it back.
drop policy if exists feedback_insert_anyone on public.troubleshooting_feedback;
create policy feedback_insert_anyone on public.troubleshooting_feedback
  for insert with check (true);

drop policy if exists feedback_admin_read on public.troubleshooting_feedback;
create policy feedback_admin_read on public.troubleshooting_feedback
  for select using (public.is_admin());

drop policy if exists feedback_admin_delete on public.troubleshooting_feedback;
create policy feedback_admin_delete on public.troubleshooting_feedback
  for delete using (public.is_admin());

-- =============================================================================
-- Seed: devices
-- =============================================================================
insert into public.devices (slug, name, category, icon_name, color_class, display_order) values
  ('keyboard',   'Keyboard',   'input',  'Keyboard', 'bg-blue-500',   10),
  ('mouse',      'Mouse',      'input',  'Mouse',    'bg-purple-500', 20),
  ('webcam',     'Webcam',     'input',  'Camera',   'bg-teal-500',   30),
  ('usb-drive',  'USB Drive',  'input',  'Usb',      'bg-orange-500', 40),
  ('lan-cable',  'LAN Cable',  'input',  'Cable',    'bg-cyan-500',   50),
  ('monitor',    'Monitor',    'output', 'Monitor',  'bg-indigo-500', 10),
  ('printer',    'Printer',    'output', 'Printer',  'bg-green-500',  20),
  ('speakers',   'Speakers',   'output', 'Volume2',  'bg-red-500',    30),
  ('projector',  'Projector',  'output', 'Projector','bg-pink-500',   40)
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  icon_name = excluded.icon_name,
  color_class = excluded.color_class,
  display_order = excluded.display_order;

-- =============================================================================
-- Seed: problems (with shared image-URL constants via a CTE)
-- =============================================================================
do $$
declare
  img_cable    text := 'https://images.unsplash.com/photo-1664285280817-0c4f784cdce6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGVjayUyMGNhYmxlJTIwY29ubmVjdGlvbnxlbnwxfHx8fDE3NjQyMzI2MDd8MA&ixlib=rb-4.1.0&q=80&w=1080';
  img_restart  text := 'https://images.unsplash.com/photo-1535551951406-a19828b0a76b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXN0YXJ0JTIwY29tcHV0ZXJ8ZW58MXx8fHwxNzY0MjMyNjA3fDA&ixlib=rb-4.1.0&q=80&w=1080';
  img_settings text := 'https://images.unsplash.com/photo-1753973170095-09e6a8515a0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXZpY2UlMjBzZXR0aW5nc3xlbnwxfHx8fDE3NjQyMzI2MDh8MA&ixlib=rb-4.1.0&q=80&w=1080';
  img_driver   text := 'https://images.unsplash.com/photo-1634743556192-d19f0c69ff3a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1cGRhdGUlMjBkcml2ZXIlMjBzb2Z0d2FyZXxlbnwxfHx8fDE3NjQyMzI2MDd8MA&ixlib=rb-4.1.0&q=80&w=1080';

  -- helper to build a step jsonb object
  function_unused boolean := false;
begin
  -- Keyboard
  insert into public.problems (device_id, slug, title, severity, steps, display_order)
  select d.id, 'keyboard-not-detected', 'Keyboard Not Detected', 'common',
    jsonb_build_array(
      jsonb_build_object('step',1,'title','Check USB Connection',  'description','Ensure the keyboard cable is firmly connected to the USB port', 'image', img_cable),
      jsonb_build_object('step',2,'title','Try Different USB Port','description','Plug the keyboard into another USB port on your computer',        'image', img_restart),
      jsonb_build_object('step',3,'title','Restart Computer',      'description','Restart your computer to refresh the USB connections',            'image', img_settings)
    ), 10
  from public.devices d where d.slug = 'keyboard'
  on conflict (device_id, slug) do nothing;

  insert into public.problems (device_id, slug, title, severity, steps, display_order)
  select d.id, 'some-keys-not-working', 'Some Keys Not Working', 'moderate',
    jsonb_build_array(
      jsonb_build_object('step',1,'title','Clean the Keyboard',     'description','Remove dust and debris from under the affected keys',     'image', img_cable),
      jsonb_build_object('step',2,'title','Update Keyboard Driver', 'description','Install the latest keyboard driver from Device Manager', 'image', img_driver)
    ), 20
  from public.devices d where d.slug = 'keyboard'
  on conflict (device_id, slug) do nothing;

  insert into public.problems (device_id, slug, title, severity, steps, display_order)
  select d.id, 'keyboard-lights-not-working', 'Keyboard Lights Not Working', 'rare',
    jsonb_build_array(
      jsonb_build_object('step',1,'title','Check Power Settings', 'description','Verify keyboard power settings in BIOS/UEFI', 'image', img_settings)
    ), 30
  from public.devices d where d.slug = 'keyboard'
  on conflict (device_id, slug) do nothing;

  -- Mouse
  insert into public.problems (device_id, slug, title, severity, steps, display_order)
  select d.id, 'mouse-not-responding', 'Mouse Not Responding', 'common',
    jsonb_build_array(
      jsonb_build_object('step',1,'title','Check Connection',           'description','Ensure mouse is properly connected to USB port', 'image', img_cable),
      jsonb_build_object('step',2,'title','Replace Batteries (Wireless)','description','For wireless mice, replace with fresh batteries','image', img_restart)
    ), 10
  from public.devices d where d.slug = 'mouse'
  on conflict (device_id, slug) do nothing;

  insert into public.problems (device_id, slug, title, severity, steps, display_order)
  select d.id, 'cursor-moving-erratically', 'Cursor Moving Erratically', 'moderate',
    jsonb_build_array(
      jsonb_build_object('step',1,'title','Clean Mouse Sensor','description','Clean the optical sensor on the bottom of the mouse','image', img_cable),
      jsonb_build_object('step',2,'title','Use Mouse Pad',     'description','Place mouse on a proper mouse pad surface',           'image', img_settings)
    ), 20
  from public.devices d where d.slug = 'mouse'
  on conflict (device_id, slug) do nothing;

  insert into public.problems (device_id, slug, title, severity, steps, display_order)
  select d.id, 'mouse-buttons-not-clicking', 'Mouse Buttons Not Clicking', 'rare',
    jsonb_build_array(
      jsonb_build_object('step',1,'title','Test Different Application','description','Check if the issue occurs in multiple programs','image', img_driver)
    ), 30
  from public.devices d where d.slug = 'mouse'
  on conflict (device_id, slug) do nothing;

  -- Webcam
  insert into public.problems (device_id, slug, title, severity, steps, display_order)
  select d.id, 'webcam-not-detected', 'Webcam Not Detected', 'common',
    jsonb_build_array(
      jsonb_build_object('step',1,'title','Check USB Connection', 'description','Ensure webcam is securely plugged into USB port',     'image', img_cable),
      jsonb_build_object('step',2,'title','Check App Permissions','description','Allow camera access in system privacy settings','image', img_settings)
    ), 10
  from public.devices d where d.slug = 'webcam'
  on conflict (device_id, slug) do nothing;

  insert into public.problems (device_id, slug, title, severity, steps, display_order)
  select d.id, 'poor-video-quality', 'Poor Video Quality', 'moderate',
    jsonb_build_array(
      jsonb_build_object('step',1,'title','Clean Camera Lens', 'description','Wipe the webcam lens with a soft, clean cloth','image', img_cable),
      jsonb_build_object('step',2,'title','Adjust Lighting',   'description','Improve lighting conditions in your room',     'image', img_restart)
    ), 20
  from public.devices d where d.slug = 'webcam'
  on conflict (device_id, slug) do nothing;

  insert into public.problems (device_id, slug, title, severity, steps, display_order)
  select d.id, 'webcam-freezing', 'Webcam Freezing', 'rare',
    jsonb_build_array(
      jsonb_build_object('step',1,'title','Close Other Applications','description','Close programs that might be using the webcam','image', img_driver)
    ), 30
  from public.devices d where d.slug = 'webcam'
  on conflict (device_id, slug) do nothing;

  -- USB Drive
  insert into public.problems (device_id, slug, title, severity, steps, display_order)
  select d.id, 'usb-drive-not-recognized', 'USB Drive Not Recognized', 'common',
    jsonb_build_array(
      jsonb_build_object('step',1,'title','Try Different USB Port','description','Plug the USB drive into another USB port', 'image', img_cable),
      jsonb_build_object('step',2,'title','Check Disk Management', 'description','Open Disk Management to see if drive appears','image', img_settings)
    ), 10
  from public.devices d where d.slug = 'usb-drive'
  on conflict (device_id, slug) do nothing;

  insert into public.problems (device_id, slug, title, severity, steps, display_order)
  select d.id, 'cannot-access-files', 'Cannot Access Files', 'moderate',
    jsonb_build_array(
      jsonb_build_object('step',1,'title','Check File System','description','Verify USB drive is formatted correctly','image', img_driver)
    ), 20
  from public.devices d where d.slug = 'usb-drive'
  on conflict (device_id, slug) do nothing;

  insert into public.problems (device_id, slug, title, severity, steps, display_order)
  select d.id, 'usb-drive-corrupted', 'USB Drive Corrupted', 'rare',
    jsonb_build_array(
      jsonb_build_object('step',1,'title','Run Error Checking','description','Use Windows Error Checking tool to scan drive','image', img_settings)
    ), 30
  from public.devices d where d.slug = 'usb-drive'
  on conflict (device_id, slug) do nothing;

  -- LAN Cable
  insert into public.problems (device_id, slug, title, severity, steps, display_order)
  select d.id, 'no-internet-connection', 'No Internet Connection', 'common',
    jsonb_build_array(
      jsonb_build_object('step',1,'title','Check Cable Connection','description','Ensure LAN cable is firmly plugged in at both ends','image', img_cable),
      jsonb_build_object('step',2,'title','Restart Router',        'description','Power cycle your router and wait 30 seconds',         'image', img_restart)
    ), 10
  from public.devices d where d.slug = 'lan-cable'
  on conflict (device_id, slug) do nothing;

  insert into public.problems (device_id, slug, title, severity, steps, display_order)
  select d.id, 'slow-connection-speed', 'Slow Connection Speed', 'moderate',
    jsonb_build_array(
      jsonb_build_object('step',1,'title','Check Cable Quality','description','Verify you''re using Cat5e or higher quality cable','image', img_cable)
    ), 20
  from public.devices d where d.slug = 'lan-cable'
  on conflict (device_id, slug) do nothing;

  insert into public.problems (device_id, slug, title, severity, steps, display_order)
  select d.id, 'intermittent-connection', 'Intermittent Connection', 'rare',
    jsonb_build_array(
      jsonb_build_object('step',1,'title','Replace Cable','description','Try using a different LAN cable','image', img_cable)
    ), 30
  from public.devices d where d.slug = 'lan-cable'
  on conflict (device_id, slug) do nothing;

  -- Monitor
  insert into public.problems (device_id, slug, title, severity, steps, display_order)
  select d.id, 'no-display-signal', 'No Display Signal', 'common',
    jsonb_build_array(
      jsonb_build_object('step',1,'title','Check Video Cable','description','Ensure HDMI/DisplayPort cable is connected properly','image', img_cable),
      jsonb_build_object('step',2,'title','Check Monitor Power','description','Verify monitor is turned on and power cable connected','image', img_restart)
    ), 10
  from public.devices d where d.slug = 'monitor'
  on conflict (device_id, slug) do nothing;

  insert into public.problems (device_id, slug, title, severity, steps, display_order)
  select d.id, 'blurry-display', 'Blurry Display', 'moderate',
    jsonb_build_array(
      jsonb_build_object('step',1,'title','Adjust Resolution','description','Set display resolution to native/recommended setting','image', img_settings)
    ), 20
  from public.devices d where d.slug = 'monitor'
  on conflict (device_id, slug) do nothing;

  insert into public.problems (device_id, slug, title, severity, steps, display_order)
  select d.id, 'screen-flickering', 'Screen Flickering', 'rare',
    jsonb_build_array(
      jsonb_build_object('step',1,'title','Update Graphics Driver','description','Install latest graphics card driver','image', img_driver)
    ), 30
  from public.devices d where d.slug = 'monitor'
  on conflict (device_id, slug) do nothing;

  -- Printer
  insert into public.problems (device_id, slug, title, severity, steps, display_order)
  select d.id, 'printer-not-responding', 'Printer Not Responding', 'common',
    jsonb_build_array(
      jsonb_build_object('step',1,'title','Check Printer Connection','description','Verify USB cable or network connection is active','image', img_cable),
      jsonb_build_object('step',2,'title','Restart Print Spooler',   'description','Restart the Print Spooler service in Windows',     'image', img_restart)
    ), 10
  from public.devices d where d.slug = 'printer'
  on conflict (device_id, slug) do nothing;

  insert into public.problems (device_id, slug, title, severity, steps, display_order)
  select d.id, 'print-quality-issues', 'Print Quality Issues', 'moderate',
    jsonb_build_array(
      jsonb_build_object('step',1,'title','Clean Print Heads','description','Run printer''s built-in cleaning utility','image', img_cable),
      jsonb_build_object('step',2,'title','Check Ink Levels', 'description','Replace empty or low ink cartridges',     'image', img_settings)
    ), 20
  from public.devices d where d.slug = 'printer'
  on conflict (device_id, slug) do nothing;

  insert into public.problems (device_id, slug, title, severity, steps, display_order)
  select d.id, 'paper-jam', 'Paper Jam', 'rare',
    jsonb_build_array(
      jsonb_build_object('step',1,'title','Remove Jammed Paper','description','Carefully remove paper from printer following manual','image', img_cable)
    ), 30
  from public.devices d where d.slug = 'printer'
  on conflict (device_id, slug) do nothing;

  -- Speakers
  insert into public.problems (device_id, slug, title, severity, steps, display_order)
  select d.id, 'no-sound-output', 'No Sound Output', 'common',
    jsonb_build_array(
      jsonb_build_object('step',1,'title','Check Volume Settings','description','Verify system volume is not muted and turned up','image', img_settings),
      jsonb_build_object('step',2,'title','Check Audio Jack',     'description','Ensure speakers are plugged into correct audio port','image', img_cable)
    ), 10
  from public.devices d where d.slug = 'speakers'
  on conflict (device_id, slug) do nothing;

  insert into public.problems (device_id, slug, title, severity, steps, display_order)
  select d.id, 'distorted-audio', 'Distorted Audio', 'moderate',
    jsonb_build_array(
      jsonb_build_object('step',1,'title','Check Audio Settings','description','Adjust audio enhancements and equalizer settings','image', img_settings)
    ), 20
  from public.devices d where d.slug = 'speakers'
  on conflict (device_id, slug) do nothing;

  insert into public.problems (device_id, slug, title, severity, steps, display_order)
  select d.id, 'one-speaker-not-working', 'One Speaker Not Working', 'rare',
    jsonb_build_array(
      jsonb_build_object('step',1,'title','Check Balance Settings','description','Verify left/right balance is centered','image', img_settings)
    ), 30
  from public.devices d where d.slug = 'speakers'
  on conflict (device_id, slug) do nothing;

  -- Projector
  insert into public.problems (device_id, slug, title, severity, steps, display_order)
  select d.id, 'no-image-displayed', 'No Image Displayed', 'common',
    jsonb_build_array(
      jsonb_build_object('step',1,'title','Check Video Cable',  'description','Verify HDMI/VGA cable is connected at both ends','image', img_cable),
      jsonb_build_object('step',2,'title','Select Input Source','description','Use projector menu to select correct input source','image', img_settings)
    ), 10
  from public.devices d where d.slug = 'projector'
  on conflict (device_id, slug) do nothing;

  insert into public.problems (device_id, slug, title, severity, steps, display_order)
  select d.id, 'blurry-projection', 'Blurry Projection', 'moderate',
    jsonb_build_array(
      jsonb_build_object('step',1,'title','Adjust Focus','description','Use projector''s focus ring to sharpen image','image', img_settings)
    ), 20
  from public.devices d where d.slug = 'projector'
  on conflict (device_id, slug) do nothing;

  insert into public.problems (device_id, slug, title, severity, steps, display_order)
  select d.id, 'overheating-shutdown', 'Overheating Shutdown', 'rare',
    jsonb_build_array(
      jsonb_build_object('step',1,'title','Clean Air Filters','description','Remove and clean projector''s air intake filters','image', img_cable)
    ), 30
  from public.devices d where d.slug = 'projector'
  on conflict (device_id, slug) do nothing;
end$$;
