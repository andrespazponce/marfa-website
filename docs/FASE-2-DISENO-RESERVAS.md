# MARFA — Fase 2: Diseño del sistema de reservas de churrasqueras

Estado: DISEÑO. Sin migraciones aplicadas. Sin código de producción escrito.
Stack verificado: Next.js 14.2 (App Router) · React 18.3 · JavaScript · CSS Modules · Supabase (Postgres)

**Revisión 3** — solicitudes sin bloqueo, confirmación manual contra pago verificado. Reemplaza por completo a las revisiones 1 y 2.

---

## 0. El modelo, en una frase

La web **no reserva**. La web **pide**. Solo el equipo, tras verificar un pago, crea una reserva que bloquea una fecha.

```
CLIENTE (web)                    EQUIPO (panel admin)
─────────────                    ────────────────────
Ve disponibilidad real
(solo lectura)
      │
Elige churrasquero + fecha
+ hora de llegada + datos
      │
      ▼
  SOLICITUD ──────────────────►  Bandeja de solicitudes
  (no bloquea nada)                     │
      │                          Contacta, envía instrucciones
      ▼                                 │
  Cliente paga  ─────────────────►  Verifica el pago a mano
                                        │
                                        ▼
                                  RESERVA confirmada
                                  ── bloquea la fecha ──
```

Dos tablas, dos naturalezas distintas:

| | `booking_requests` | `bookings` |
|---|---|---|
| Quién la crea | El cliente, desde la web | El equipo, desde el panel |
| ¿Bloquea la fecha? | **No** | **Sí** |
| ¿Restricción de unicidad? | **No** — varias personas pueden pedir el mismo día | **Sí** — un churrasquero, una fecha |
| Requiere pago | No | Sí, verificado a mano |

### Lo que desaparece de la revisión 2

Eliminado por completo, no comentado ni dejado "por si acaso":

- El estado `pending` y toda su semántica de bloqueo provisional.
- El campo `expires_at` y la ventana de 12 horas.
- La expiración perezosa en el camino de escritura (`UPDATE ... where expires_at < now()` dentro de la función de inserción).
- La función `expire_stale_bookings()`.
- El job de `pg_cron` y la extensión.
- El filtro `expires_at > now()` en la consulta de disponibilidad.
- El monitoreo del cron.

Esto es una mejora sustancial de ingeniería, no solo un cambio de reglas. Se elimina la única pieza de infraestructura crítica del sistema — un job programado del que dependía la capacidad de vender — y con ella todo un conjunto de modos de fallo: cron caído, reservas fantasma, congelamiento del calendario, desincronización entre lo visible y lo insertable. El sistema pasa a ser una base de datos con un índice único y nada más en movimiento. Menos partes, menos fallos.

El precio de esa simplicidad está en la sección 7: una ventana de carrera que ahora es visible para el cliente en vez de estar escondida en la base de datos.

---

## 1. Esquema SQL

```sql
-- ═══════════════════════════════════════════════════════════════════════════
-- MARFA · Migración 001 — Solicitudes y reservas de churrasqueras
-- Modelo: la web genera solicitudes; el equipo confirma reservas contra pago.
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";
-- NOTA: pg_cron ya NO es necesaria. No hay expiraciones automáticas.

-- ── Tipos ──────────────────────────────────────────────────────────────────
create type public.booking_status as enum (
  'confirmed',   -- pagada, verificada, bloquea la fecha
  'cancelled',   -- anulada por cliente o equipo
  'completed'    -- ya ocurrió
);

create type public.booking_channel as enum (
  'web_request', -- nació de una solicitud de la web
  'whatsapp',
  'phone',
  'walk_in'
);

create type public.request_status as enum (
  'new',         -- recién llegada, sin atender
  'contacted',   -- el equipo ya envió instrucciones de pago
  'converted',   -- se pagó, verificó y convirtió en reserva
  'declined',    -- rechazada (fecha ya tomada, no viable)
  'abandoned'    -- el cliente nunca pagó
);

create type public.payment_method as enum ('transfer', 'qr', 'cash', 'other');

-- ═══════════════════════════════════════════════════════════════════════════
-- Tabla: grills
-- ═══════════════════════════════════════════════════════════════════════════
create table public.grills (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,            -- 'c1' … 'c7'
  name         text not null,
  sort_order   smallint not null unique,        -- 1..7, orden en el panel
  capacity     smallint not null check (capacity > 0),
  price_bob    numeric(10,2) not null default 0 check (price_bob >= 0),
  description  text,
  cover_image  text not null,
  photos       text[] not null default '{}',
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on column public.grills.slug is
  'Identificador estable c1..c7. Coincide con lib/site-config.js y /public/assets/areas/.';
comment on column public.grills.price_bob is
  'Precio por día completo en bolivianos. Se usa como monto esperado al verificar el pago.';

create index grills_active_order_idx on public.grills (sort_order) where is_active;

-- ═══════════════════════════════════════════════════════════════════════════
-- Tabla: booking_requests — SOLICITUDES. No bloquean nada.
-- Sin restricción de unicidad: varias personas pueden pedir la misma fecha.
-- El equipo decide según quién pagó primero.
-- ═══════════════════════════════════════════════════════════════════════════
create table public.booking_requests (
  id              uuid primary key default gen_random_uuid(),
  reference       text not null unique
                    default 'SOL-' || upper(substr(encode(gen_random_bytes(4),'hex'),1,6)),

  grill_id        uuid not null references public.grills(id) on delete restrict,
  requested_date  date not null,
  arrival_time    time not null,      -- hora estimada de llegada, informativa

  status          public.request_status not null default 'new',

  customer_name   text not null check (length(trim(customer_name)) between 2 and 120),
  customer_phone  text not null check (customer_phone ~ '^\+?[0-9]{7,15}$'),
  customer_email  text,
  guests          smallint not null check (guests between 1 and 500),
  notes           text check (length(notes) <= 1000),

  -- Trazabilidad de gestión
  handled_by      uuid references auth.users(id),
  handled_at      timestamptz,
  internal_notes  text,
  declined_reason text,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.booking_requests is
  'Solicitudes generadas desde la web. NO bloquean disponibilidad. Deliberadamente sin índice único: varias solicitudes pueden competir por la misma fecha y el equipo resuelve según pago.';

create index requests_status_created_idx on public.booking_requests (status, created_at desc);
create index requests_date_idx           on public.booking_requests (requested_date);
create index requests_grill_date_idx     on public.booking_requests (grill_id, requested_date);
create index requests_phone_idx          on public.booking_requests (customer_phone);

-- ═══════════════════════════════════════════════════════════════════════════
-- Tabla: bookings — RESERVAS. Solo las crea el equipo. Bloquean la fecha.
-- ═══════════════════════════════════════════════════════════════════════════
create table public.bookings (
  id              uuid primary key default gen_random_uuid(),
  reference       text not null unique
                    default 'MF-' || upper(substr(encode(gen_random_bytes(4),'hex'),1,6)),

  grill_id        uuid not null references public.grills(id) on delete restrict,
  booking_date    date not null,
  arrival_time    time not null,

  status          public.booking_status not null default 'confirmed',
  channel         public.booking_channel not null default 'web_request',

  -- Origen: la solicitud que la generó, si vino de la web
  request_id      uuid references public.booking_requests(id) on delete set null,

  customer_name   text not null check (length(trim(customer_name)) between 2 and 120),
  customer_phone  text not null check (customer_phone ~ '^\+?[0-9]{7,15}$'),
  customer_email  text,
  guests          smallint not null check (guests between 1 and 500),
  notes           text check (length(notes) <= 1000),

  -- ── PAGO ────────────────────────────────────────────────────────────────
  -- La verificación es manual hoy. Los campos quedan listos para automatizar
  -- (comprobante por WhatsApp, conciliación bancaria) sin migrar después.
  payment_amount     numeric(10,2) check (payment_amount >= 0),
  payment_currency   char(3) not null default 'BOB',
  payment_method     public.payment_method,
  payment_reference  text,              -- nº de transacción, glosa, últimos dígitos
  payment_proof_url  text,              -- comprobante en Supabase Storage
  payment_verified_at timestamptz,
  payment_verified_by uuid references auth.users(id),
  payment_notes      text,

  created_by      uuid references auth.users(id),  -- siempre un humano del equipo
  cancelled_at    timestamptz,
  cancel_reason   text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- Una reserva confirmada exige constancia de pago verificado
  constraint bookings_confirmed_requires_payment
    check (
      status <> 'confirmed'
      or (payment_verified_at is not null and payment_verified_by is not null)
    )
);

comment on constraint bookings_confirmed_requires_payment on public.bookings is
  'Regla de negocio a nivel de base: no se confirma nada sin pago verificado por una persona identificable.';

-- ───────────────────────────────────────────────────────────────────────────
-- EXCLUSIVIDAD
-- Un churrasquero, una fecha, una reserva viva. Solo confirmadas y completadas
-- ocupan: las canceladas liberan el día automáticamente.
-- Índice único PARCIAL: Postgres no admite WHERE en ADD CONSTRAINT UNIQUE.
-- ───────────────────────────────────────────────────────────────────────────
create unique index bookings_one_per_grill_day
  on public.bookings (grill_id, booking_date)
  where status in ('confirmed', 'completed');

create index bookings_date_status_idx on public.bookings (booking_date, status);
create index bookings_grill_date_idx  on public.bookings (grill_id, booking_date);
create index bookings_phone_idx       on public.bookings (customer_phone);
create index bookings_request_idx     on public.bookings (request_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- Tabla: property_blocks — eventos privados, mantenimiento, cierres
-- ═══════════════════════════════════════════════════════════════════════════
create table public.property_blocks (
  id          uuid primary key default gen_random_uuid(),
  block_date  date not null,
  grill_id    uuid references public.grills(id) on delete cascade,
                              -- null = bloquea las 7 (evento privado)
  reason      text not null,
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now()
);

create index property_blocks_date_idx on public.property_blocks (block_date);
create unique index property_blocks_unique
  on public.property_blocks (
    block_date,
    coalesce(grill_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- Trigger updated_at
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger grills_touch    before update on public.grills
  for each row execute function public.touch_updated_at();
create trigger bookings_touch  before update on public.bookings
  for each row execute function public.touch_updated_at();
create trigger requests_touch  before update on public.booking_requests
  for each row execute function public.touch_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════
-- Disponibilidad pública — SOLO LECTURA
-- Devuelve los días ocupados por reservas confirmadas y bloqueos.
-- Las solicitudes NO aparecen aquí: no ocupan.
-- Sin lógica de expiración. Sin now(). Determinista.
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public.get_availability(p_from date, p_to date)
returns table (grill_slug text, booking_date date)
language sql
stable
security definer
set search_path = public
as $$
  with bounded as (
    select p_from as d_from, least(p_to, p_from + 120)::date as d_to
  )
  select g.slug, b.booking_date
    from public.bookings b
    join public.grills g on g.id = b.grill_id
   cross join bounded
   where b.booking_date between bounded.d_from and bounded.d_to
     and b.status in ('confirmed', 'completed')

  union

  select g.slug, pb.block_date
    from public.property_blocks pb
   cross join bounded
    join public.grills g on (pb.grill_id is null or g.id = pb.grill_id)
   where pb.block_date between bounded.d_from and bounded.d_to
     and g.is_active;
$$;

revoke all on function public.get_availability(date, date) from public;
grant execute on function public.get_availability(date, date) to anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- Envío de solicitud desde la web
-- No inserta en bookings. No bloquea. No puede fallar por colisión.
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public.submit_booking_request(
  p_grill_slug     text,
  p_requested_date date,
  p_arrival_time   time,
  p_customer_name  text,
  p_customer_phone text,
  p_guests         smallint,
  p_customer_email text default null,
  p_notes          text default null
)
returns table (reference text, request_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_grill   public.grills%rowtype;
  v_req     public.booking_requests%rowtype;
  v_today   date := (now() at time zone 'America/La_Paz')::date;
  v_recent  integer;
begin
  select * into v_grill from public.grills
   where slug = p_grill_slug and is_active;
  if not found then
    raise exception 'GRILL_NOT_FOUND' using errcode = 'P0002';
  end if;

  if p_requested_date < v_today then
    raise exception 'DATE_IN_PAST' using errcode = 'P0001';
  end if;

  if p_requested_date > v_today + 120 then
    raise exception 'DATE_TOO_FAR' using errcode = 'P0001';
  end if;

  if p_guests > v_grill.capacity then
    raise exception 'OVER_CAPACITY' using errcode = 'P0001';
  end if;

  -- La fecha ya está vendida: no tiene sentido aceptar la solicitud
  if exists (
    select 1 from public.bookings b
     where b.grill_id = v_grill.id
       and b.booking_date = p_requested_date
       and b.status in ('confirmed','completed')
  ) then
    raise exception 'DATE_TAKEN' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.property_blocks pb
     where pb.block_date = p_requested_date
       and (pb.grill_id is null or pb.grill_id = v_grill.id)
  ) then
    raise exception 'DATE_BLOCKED' using errcode = 'P0001';
  end if;

  -- ── Anti-spam ────────────────────────────────────────────────────────────
  -- Sin índice único, nada impide que un bot cree miles de solicitudes.
  -- Tope simple por teléfono y ventana de tiempo.
  select count(*) into v_recent
    from public.booking_requests
   where customer_phone = p_customer_phone
     and created_at > now() - interval '1 hour';

  if v_recent >= 5 then
    raise exception 'TOO_MANY_REQUESTS' using errcode = 'P0001';
  end if;

  insert into public.booking_requests (
    grill_id, requested_date, arrival_time,
    customer_name, customer_phone, customer_email, guests, notes
  ) values (
    v_grill.id, p_requested_date, p_arrival_time,
    trim(p_customer_name), p_customer_phone, p_customer_email, p_guests, p_notes
  )
  returning * into v_req;

  return query select v_req.reference, v_req.id;
end;
$$;

revoke all on function public.submit_booking_request(
  text, date, time, text, text, smallint, text, text
) from public;
grant execute on function public.submit_booking_request(
  text, date, time, text, text, smallint, text, text
) to anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- Conversión: solicitud + pago verificado → reserva confirmada
-- Solo la ejecuta un usuario autenticado del equipo. Atómica.
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public.confirm_request_as_booking(
  p_request_id        uuid,
  p_payment_amount    numeric,
  p_payment_method    public.payment_method,
  p_payment_reference text default null,
  p_payment_proof_url text default null,
  p_payment_notes     text default null
)
returns table (reference text, booking_id uuid)
language plpgsql
as $$
declare
  v_req     public.booking_requests%rowtype;
  v_booking public.bookings%rowtype;
  v_uid     uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '42501';
  end if;

  select * into v_req from public.booking_requests where id = p_request_id;
  if not found then
    raise exception 'REQUEST_NOT_FOUND' using errcode = 'P0002';
  end if;

  if v_req.status = 'converted' then
    raise exception 'ALREADY_CONVERTED' using errcode = 'P0001';
  end if;

  begin
    insert into public.bookings (
      grill_id, booking_date, arrival_time, status, channel, request_id,
      customer_name, customer_phone, customer_email, guests, notes,
      payment_amount, payment_method, payment_reference, payment_proof_url,
      payment_notes, payment_verified_at, payment_verified_by, created_by
    ) values (
      v_req.grill_id, v_req.requested_date, v_req.arrival_time,
      'confirmed', 'web_request', v_req.id,
      v_req.customer_name, v_req.customer_phone, v_req.customer_email,
      v_req.guests, v_req.notes,
      p_payment_amount, p_payment_method, p_payment_reference, p_payment_proof_url,
      p_payment_notes, now(), v_uid, v_uid
    )
    returning * into v_booking;
  exception when unique_violation then
    -- Alguien más ya confirmó esa fecha. El equipo debe rechazar y devolver.
    raise exception 'DATE_TAKEN' using errcode = '23505';
  end;

  update public.booking_requests
     set status = 'converted', handled_by = v_uid, handled_at = now()
   where id = p_request_id;

  return query select v_booking.reference, v_booking.id;
end;
$$;

revoke all on function public.confirm_request_as_booking(
  uuid, numeric, public.payment_method, text, text, text
) from public, anon;
grant execute on function public.confirm_request_as_booking(
  uuid, numeric, public.payment_method, text, text, text
) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- Vista del panel admin — grilla multi-unidad
-- ═══════════════════════════════════════════════════════════════════════════
create or replace function public.admin_calendar(p_from date, p_to date)
returns table (
  grill_slug     text,
  grill_name     text,
  sort_order     smallint,
  entry_date     date,
  booking_id     uuid,
  reference      text,
  status         public.booking_status,
  channel        public.booking_channel,
  customer_name  text,
  customer_phone text,
  guests         smallint,
  arrival_time   time,
  payment_amount numeric,
  is_block       boolean,
  block_reason   text,
  request_count  integer      -- solicitudes abiertas compitiendo por ese día
)
language sql
stable
as $$
  select g.slug, g.name, g.sort_order, b.booking_date, b.id, b.reference,
         b.status, b.channel, b.customer_name, b.customer_phone,
         b.guests, b.arrival_time, b.payment_amount,
         false, null::text, 0
    from public.bookings b
    join public.grills g on g.id = b.grill_id
   where b.booking_date between p_from and p_to
     and b.status in ('confirmed','completed')

  union all

  select g.slug, g.name, g.sort_order, pb.block_date, null, null,
         null, null, null, null, null, null, null,
         true, pb.reason, 0
    from public.property_blocks pb
    join public.grills g on (pb.grill_id is null or g.id = pb.grill_id)
   where pb.block_date between p_from and p_to
     and g.is_active

  union all

  -- Días libres con solicitudes pendientes: señal de demanda para el operador
  select g.slug, g.name, g.sort_order, r.requested_date, null, null,
         null, null, null, null, null, null, null,
         false, null::text, count(*)::integer
    from public.booking_requests r
    join public.grills g on g.id = r.grill_id
   where r.requested_date between p_from and p_to
     and r.status in ('new','contacted')
   group by g.slug, g.name, g.sort_order, r.requested_date;
$$;

revoke all on function public.admin_calendar(date, date) from public, anon;
grant execute on function public.admin_calendar(date, date) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS
-- ═══════════════════════════════════════════════════════════════════════════
alter table public.grills           enable row level security;
alter table public.booking_requests enable row level security;
alter table public.bookings         enable row level security;
alter table public.property_blocks  enable row level security;

create policy grills_public_read on public.grills
  for select to anon, authenticated using (is_active);
create policy grills_admin_all on public.grills
  for all to authenticated using (true) with check (true);

-- booking_requests: CERO acceso para anon. Nombre y teléfono de clientes.
-- El público solo escribe a través de submit_booking_request (SECURITY DEFINER).
create policy requests_admin_read on public.booking_requests
  for select to authenticated using (true);
create policy requests_admin_update on public.booking_requests
  for update to authenticated using (true) with check (true);
create policy requests_admin_insert on public.booking_requests
  for insert to authenticated with check (true);

-- bookings: CERO acceso para anon. El público solo ve get_availability.
create policy bookings_admin_read on public.bookings
  for select to authenticated using (true);
create policy bookings_admin_insert on public.bookings
  for insert to authenticated with check (true);
create policy bookings_admin_update on public.bookings
  for update to authenticated using (true) with check (true);
-- Sin política DELETE en ninguna tabla: se cancela, no se borra.

create policy blocks_public_read on public.property_blocks
  for select to anon, authenticated using (true);
create policy blocks_admin_write on public.property_blocks
  for all to authenticated using (true) with check (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- Seed (capacidad y precio son PLACEHOLDER — confirmar con operaciones)
-- ═══════════════════════════════════════════════════════════════════════════
insert into public.grills (slug, name, sort_order, capacity, price_bob, cover_image, photos) values
  ('c1','Churrasquero C1',1,20,0,'c1-cover.jpg',array['c1-cover.jpg','c1-2.jpg','c1-3.jpg']),
  ('c2','Churrasquero C2',2,20,0,'c2-cover.jpg',array['c2-cover.jpg','c2-2.jpg']),
  ('c3','Churrasquero C3',3,20,0,'c3-cover.jpg',array['c3-cover.jpg']),
  ('c4','Churrasquero C4',4,20,0,'c4-cover.jpg',array['c4-cover.jpg','c4-2.jpg']),
  ('c5','Churrasquero C5',5,20,0,'c5-cover.jpg',array['c5-cover.jpg','c5-2.jpg']),
  ('c6','Churrasquero C6',6,20,0,'c6-cover.jpg',array['c6-cover.jpg','c6-2.jpg','c6-3.jpg']),
  ('c7','Churrasquero C7',7,20,0,'c7-cover.jpg',array['c7-cover.jpg','c7-2.jpg']);
```

### Detalles del esquema que conviene notar

**`bookings_confirmed_requires_payment`.** La regla "no se confirma nada sin pago" vive en la base, no en el código de la aplicación. Un `UPDATE` manual desde el dashboard de Supabase que intente confirmar sin `payment_verified_at` falla. Es la clase de regla que se rompe sola cuando solo está en el frontend.

**Los campos de pago están completos aunque la verificación sea manual.** `payment_amount`, `payment_method`, `payment_reference`, `payment_proof_url`, `payment_verified_at`, `payment_verified_by`, `payment_notes`. Cuando llegue la automatización — lectura de comprobantes por WhatsApp o conciliación bancaria — solo cambia quién los llena, no la estructura. Cero migraciones de datos.

**`request_id` en `bookings`.** Permite medir la tasa de conversión solicitud → reserva, que es la métrica que dirá si el modelo de pago manual está perdiendo clientes. Sin este campo, ese dato se pierde.

**Anti-spam explícito.** Al quitar el índice único de las solicitudes se abre la puerta a inundar la bandeja. El tope de 5 por teléfono por hora es un mínimo; si aparece abuso real, añadir Cloudflare Turnstile en el formulario.

**`admin_calendar` cuenta solicitudes por día libre.** El operador ve en la grilla no solo qué está vendido, sino dónde hay demanda esperando gestión. Es la señal que convierte el calendario en herramienta de venta y no solo de registro.

---

## 2. Plan de implementación por pasos

### Paso 0 — Entorno
- `npm install` (no hay `node_modules`).
- `npm i @supabase/supabase-js @supabase/ssr react-day-picker@^9 date-fns zod`
- **Modificar** `.env.local.example`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- Verificar `.env.local` en `.gitignore`.

### Paso 1 — Base de datos
- Crear proyecto Supabase (vía MCP conectado).
- Aplicar la migración de la sección 1 **tras tu aprobación**.
- Verificaciones:
  - `get_availability(current_date, current_date + 30)` → vacío, sin error.
  - Dos `submit_booking_request` para el mismo churrasquero y fecha → **ambos deben funcionar**. Es el comportamiento correcto.
  - `confirm_request_as_booking` sobre dos solicitudes de la misma fecha → la segunda devuelve `DATE_TAKEN`.
  - `INSERT` directo en `bookings` con `status='confirmed'` sin `payment_verified_at` → debe fallar por la constraint.
  - `get_advisors` de Supabase, resolver lo que marque.
- Crear bucket privado en Supabase Storage para comprobantes de pago.

### Paso 2 — Capa de datos
- **Crear** `lib/supabase/server.js` — cliente anon para Server Components y Actions.
- **Crear** `lib/supabase/admin.js` — service role, exclusivo del panel. Nunca importar desde cliente.
- **Crear** `lib/bookings.js` — `getGrills()`, `getAvailability(from,to)`, `submitRequest(payload)`.
- **Crear** `lib/admin.js` — `getRequests(filters)`, `getAdminCalendar(from,to)`, `confirmRequest(...)`, `createManualBooking(...)`, `declineRequest(...)`, `createBlock(...)`.
- **Crear** `lib/dates.js` — helpers `date-fns` con zona `America/La_Paz`.

### Paso 3 — Migrar contenido de churrasqueras
- **Modificar** `lib/site-config.js`: dejar solo textos de sección. Quitar `asadores.items`.
- **Modificar** `lib/directus.js`: `getSiteConfig()` incorpora `grills` desde Supabase.
- **Modificar** `app/page.js`: pasar `grills` a `AsadoresSection`.
- Commit propio: es donde puede romperse la galería existente.

### Paso 4 — Fix WhatsApp (independiente, desplegable hoy)
- **Modificar** `components/sections/AsadoresSection.js`. Detalle en sección 6.

### Paso 5 — Calendario del cliente (solo lectura)
- **Crear** `components/booking/GrillCalendar.js` + `.module.css`
- **Crear** `app/booking-calendar.css` — mapeo de variables `--rdp-*` a tokens MARFA.
- Detalle en sección 4.

### Paso 6 — Flujo de solicitud
- **Crear** `app/actions/requests.js` — Server Action validada con Zod.
- **Crear** `components/booking/RequestFlow.js` — máquina de 3 pasos.
- **Crear** `components/booking/SubmitButton.js` — separado, obligatorio por `useFormStatus()`.
- **Modificar** `AsadoresSection.js` — el modal abre el flujo.

```js
// components/booking/SubmitButton.js — React 18.3, NO useActionState
'use client';
import { useFormStatus } from 'react-dom';

export default function SubmitButton({ children }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Enviando…' : children}
    </button>
  );
}
```

```js
// components/booking/RequestFlow.js
'use client';
import { useFormState } from 'react-dom';   // NO desde 'react'
import { submitRequestAction } from '@/app/actions/requests';

const initialState = { ok: false, error: null, reference: null };
const [state, formAction] = useFormState(submitRequestAction, initialState);
```

`useActionState` es React 19. Este proyecto usa React 18.3. Verificado contra la documentación de Next: en 18.3 el hook es `useFormState` de `react-dom`, y `useFormStatus()` solo funciona dentro de un componente hijo del `<form>` — de ahí el `SubmitButton` separado.

### Paso 7 — Panel de admin (herramienta principal de operación)
- **Crear** `middleware.js` — proteger `/admin/*`.
- **Crear** `app/admin/layout.js` — guard de sesión + navegación.
- **Crear** `app/admin/login/page.js`
- **Crear** `app/admin/page.js` — **bandeja de solicitudes**. Pantalla de inicio: es el trabajo diario.
- **Crear** `app/admin/calendario/page.js` — calendario multi-unidad.
- **Crear** `components/admin/RequestInbox.js` + `.module.css`
- **Crear** `components/admin/ConfirmPaymentDialog.js` — captura de datos de pago.
- **Crear** `components/admin/MultiCalendar.js` + `.module.css`
- **Crear** `components/admin/BookingDrawer.js`
- **Crear** `components/admin/ManualBookingForm.js`
- **Crear** `app/actions/admin.js` — `confirmRequest`, `declineRequest`, `createManualBooking`, `cancelBooking`, `createBlock`.
- Detalle en sección 5.

### Paso 8 — Notificaciones
- Solicitud entrante → WhatsApp al operador con referencia `SOL-XXXXXX` y enlace directo a la bandeja.
- Confirmación → WhatsApp al cliente con la referencia `MF-XXXXXX`.
- Recomendado: correo al cliente al enviar la solicitud, con el texto explícito de que la fecha **no** está apartada.

### Paso 9 — Verificación
- Concurrencia: dos `confirm_request_as_booking` simultáneos sobre la misma fecha. Exactamente uno pasa.
- Solicitudes múltiples: tres personas piden el mismo día. Las tres se guardan. Solo una se convierte.
- Constraint de pago: intentar confirmar sin verificación. Debe fallar.
- RLS: con la anon key desde el navegador, `select * from booking_requests` y `from bookings` → 0 filas en ambas.
- Zona horaria: solicitar a las 23:50 hora Bolivia, verificar que la fecha no salta.
- Lighthouse móvil sobre el flujo completo.

---

## 3. Los dos puntos críticos

### a) La ventana en la que la web miente

**El problema.** Entre que alguien paga y que el equipo verifica ese pago, la web sigue mostrando esa fecha como libre. Otro cliente puede enviar una solicitud por el mismo día, e incluso pagar, antes de que el primero quede registrado.

**Cuánto daño hace, en realidad.** Menos del que parece, y conviene ser preciso sobre por qué:

- **No produce doble reserva.** El índice único lo impide de forma absoluta. Físicamente no pueden existir dos reservas confirmadas para el mismo churrasquero y día. El peor escenario nunca es que dos grupos se presenten el sábado.
- **El daño real es una devolución y una conversación incómoda.** Alguien pagó por algo que ya no está disponible. Hay que devolverle el dinero y explicarle. Es costo operativo y desgaste de reputación, no una falla del sistema.
- **La frecuencia es proporcional al tiempo de verificación multiplicado por la demanda.** Con verificación en menos de una hora y unas pocas solicitudes al día, la colisión es rara. Con verificación al día siguiente y diez solicitudes por fin de semana, es cuestión de tiempo.

Esto significa que **el problema no se resuelve con código, se resuelve con velocidad de verificación**. La palanca principal es que el operador revise la bandeja seguido. Todo lo demás es mitigación.

**Mitigación 1 — Honestidad en la interfaz. La más importante.**

El cliente debe entender, antes de pagar, que la fecha no está apartada. No en letra chica: en el texto principal, en tres momentos.

En el calendario:
> Disponibilidad actualizada. Las fechas se apartan únicamente al confirmarse el pago.

En el botón de envío — el cambio de una sola palabra que evita la mayoría de los malentendidos:
> **Enviar solicitud** — no "Reservar"

En la pantalla de confirmación:
> **Solicitud enviada** · SOL-A3F91C
> Todavía no es una reserva. Te escribimos por WhatsApp con los datos de pago.
> **La fecha se aparta a tu nombre recién cuando confirmamos el pago.**

Esa última frase es el elemento más importante de todo el flujo. Es lo único que separa a un cliente que entiende el proceso de uno que llega el sábado a discutir. Nunca suavizarla por razones de conversión: el cliente que se pierde por leerla se habría perdido igual, pero enojado y en público.

**Mitigación 2 — Velocidad, con visibilidad.**

La bandeja de solicitudes es la pantalla de inicio del panel. Las nuevas se muestran con la antigüedad visible (`hace 2h 14m`) y en dorado hasta ser atendidas. Alerta al operador si algo lleva más de X horas sin gestión. El objetivo operativo: verificar en menos de una hora en horario de atención.

**Mitigación 3 — Señal de competencia.**

Si un día ya tiene solicitudes abiertas, decirlo:
> 2 personas más consultaron esta fecha. Se confirma al primero que complete el pago.

Es información verdadera, útil para el cliente, y crea urgencia legítima para pagar rápido — que es exactamente el comportamiento que reduce la ventana de riesgo. No es un truco de escasez inventado: sale de un `count()` real.

**Mitigación 4 — Verificar antes de cobrar.**

Regla de proceso: el operador comprueba que la fecha sigue libre **en el momento de enviar las instrucciones de pago**, no después. Reduce el intervalo de riesgo desde "solicitud a verificación" hasta "instrucciones a pago", que es mucho más corto. El botón de la bandeja que genera el mensaje de WhatsApp debe mostrar el estado actual de esa fecha junto al botón.

### b) ¿Reserva provisional corta tras enviar la solicitud?

**Recomendación: no. No implementarla.**

El razonamiento, que es lo que importa:

Un bloqueo provisional automático solo tiene sentido si su duración se parece al tiempo que tarda el proceso que protege. Aquí el proceso es *un ser humano revisando un comprobante*. Ese tiempo no lo controla el sistema: depende de si el operador está despierto, ocupado o es domingo.

- **Bloqueo corto (30–60 min):** expira antes de que nadie verifique nada. El cliente ve "apartado por 45 minutos", nadie llega a verificar en ese plazo, el bloqueo cae y la fecha vuelve a estar libre. Se prometió algo y se incumplió. Peor que no prometer nada.
- **Bloqueo largo (12–24 h):** reintroduce exactamente la maquinaria que este cambio de reglas acaba de eliminar — estado `pending`, `expires_at`, expiración perezosa, cron, monitoreo — y encima abre un agujero de negocio: cualquiera puede bloquear las 7 churrasqueras para todo un fin de semana, gratis y sin identificarse. Sin pago que lo respalde, un bloqueo automático es un arma para el abuso.

En ambos casos se paga complejidad sin comprar corrección: **el cuello de botella es humano y ningún temporizador lo acelera.**

Y hay un argumento de fondo: el bloqueo provisional intenta resolver con software un problema que ya está resuelto con expectativas. Si la interfaz dice claramente "esto es una solicitud, la fecha se aparta al pagar", no hay nada que proteger. El cliente ya sabe dónde está parado. Un bloqueo provisional lo que hace es *volver a prometer* lo que acabamos de aclarar que no se promete — y reintroduce la ambigüedad que este modelo elimina.

**La variante que sí vale, más adelante.** Un bloqueo **iniciado por el operador**, no automático: cuando envía las instrucciones de pago a alguien que evaluó como real, marca la fecha como retenida por N horas desde el panel. Es un acto deliberado de una persona con criterio, no un efecto secundario de llenar un formulario. Resuelve el caso concreto ("le dije que pagara, no quiero que me lo tomen mientras tanto") sin abrir la puerta al abuso.

No construirlo ahora. Construirlo si tras un mes de operación los datos muestran colisiones reales — `booking_requests` con `status='declined'` y motivo "fecha tomada" es exactamente la métrica que lo dirá. Si ese número es cercano a cero, el bloqueo provisional habría sido complejidad pura.

---

## 4. Calendario del cliente (react-day-picker v9)

Ahora es **estrictamente de solo lectura sobre la disponibilidad**: refleja reservas confirmadas y bloqueos. Las solicitudes no lo alteran.

### Principio: sin tema propio de la librería

```css
/* app/booking-calendar.css — importado una vez en app/layout.js */
@import 'react-day-picker/style.css';

.marfaCalendar {
  --rdp-accent-color:            var(--clr-accent);    /* verde bosque #6b8f5e */
  --rdp-accent-background-color: rgba(107, 143, 94, 0.15);
  --rdp-day-height:              44px;                 /* mínimo táctil */
  --rdp-day-width:               44px;
  --rdp-font-family:             var(--font-sans);
  --rdp-outline:                 2px solid var(--clr-gold);
  --rdp-outline-selected:        2px solid var(--clr-gold);

  color: var(--clr-text);
  background: var(--clr-surface);
  border: 1px solid var(--clr-border);
  border-radius: var(--radius-lg);
  padding: var(--sp-md);
}

.marfaCalendar :global(.rdp-month_caption) {
  font-family: var(--font-serif);
  font-size: 1.5rem;
  font-weight: 400;
  text-transform: capitalize;
}
```

Verificar el listado exacto de variables `--rdp-*` contra `node_modules/react-day-picker/dist/style.css` al instalar. `--rdp-accent-color` está confirmada en la documentación oficial; las demás se ajustan leyendo la hoja real en el paso 5.

### Estados visuales

| Estado | Modificador | Aspecto | Interacción |
|---|---|---|---|
| **Disponible** | (ninguno) | Texto `--clr-text`, fondo transparente, borde 1px `--clr-border`. Hover: fondo `rgba(107,143,94,.12)`, borde `--clr-accent` | Clicable |
| **Reservado** | `booked` | Texto `--clr-text-dim` al 40%, línea diagonal sutil, sin borde | No clicable (`disabled`) |
| **Solicitado por otros** | `requested` | Igual que disponible + punto dorado 4px bajo el número | Clicable — se puede solicitar igual |
| **Seleccionado** | `selected` | Fondo `--clr-accent` sólido, texto `--clr-bg`, anillo exterior 2px `--clr-gold` | Clicable (deselecciona) |
| **Pasado / fuera de rango** | `disabled` | Opacidad 0.25, cursor `not-allowed` | No clicable |
| **Hoy** | `today` | Disponible + subrayado dorado 2px | Clicable |

El estado `requested` es opcional y depende de la mitigación 3 de la sección 3a. Si se implementa, el punto dorado comunica competencia real sin bloquear — el cliente puede solicitar igual, y sabe que conviene pagar rápido. Requiere exponer un conteo agregado de solicitudes abiertas por día en `get_availability`, sin datos personales.

### Componente

```js
// components/booking/GrillCalendar.js
'use client';

import { useMemo } from 'react';
import { DayPicker } from 'react-day-picker';
import { es } from 'react-day-picker/locale';
import { addDays, startOfToday, format } from 'date-fns';
import styles from './GrillCalendar.module.css';

export default function GrillCalendar({ grillSlug, availability, selected, onSelect }) {
  const today   = startOfToday();
  const maxDate = addDays(today, 120);

  // availability: [{ grill_slug, booking_date }]
  const bookedDays = useMemo(() => {
    const set = new Set();
    for (const row of availability) {
      if (row.grill_slug === grillSlug) set.add(row.booking_date);
    }
    return set;
  }, [availability, grillSlug]);

  const isBooked = (date) => bookedDays.has(format(date, 'yyyy-MM-dd'));

  return (
    <DayPicker
      mode="single"
      locale={es}
      selected={selected}
      onSelect={onSelect}
      startMonth={today}
      endMonth={maxDate}
      disabled={[{ before: today }, { after: maxDate }, isBooked]}
      modifiers={{ booked: isBooked }}
      modifiersClassNames={{ booked: styles.dayBooked }}
      classNames={{
        root:       styles.marfaCalendar,
        day:        styles.day,
        day_button: styles.dayButton,
        selected:   styles.daySelected,
        today:      styles.dayToday,
        disabled:   styles.dayDisabled,
      }}
      footer={
        <p className={styles.footerNote}>
          Disponibilidad actualizada. Las fechas se apartan únicamente
          al confirmarse el pago.
        </p>
      }
    />
  );
}
```

API verificada contra la documentación v9: `mode`, `selected`, `onSelect`, `disabled` (acepta `Matcher | Matcher[]`, incluida función predicado), `modifiers`, `modifiersClassNames`, `footer`, y las claves planas de `classNames` (`root`, `day`, `day_button`, `selected`, `today`, `disabled`), que en v9 reemplazaron a las de v8 (`day_selected`, `cell`).

**Aviso de versión:** react-day-picker v10 renombró el paquete a `@daypicker/react`. Fijar `^9` en `package.json`.

---

## 5. Panel de admin — la herramienta principal

El panel deja de ser un accesorio: **es donde ocurre el negocio**. Ninguna reserva existe sin pasar por aquí. Dos pantallas.

### 5.1 Bandeja de solicitudes (pantalla de inicio)

Es el trabajo diario. Debe abrirse por defecto al entrar.

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Solicitudes            [ Nuevas 4 ]  [ Contactadas 2 ]  [ Todas ]         │
├────────────────────────────────────────────────────────────────────────────┤
│ ● SOL-A3F91C   hace 14 min                                     ⚠ COMPITE   │
│   Roberto Ledezma · +591 712 34567 · 18 personas                           │
│   C5 · sábado 15 de agosto · llegada 10:30                                 │
│   "Cumpleaños, llevamos torta"                                             │
│   ⚠ Otra solicitud para C5 el 15 ago (SOL-B7C22D, hace 2h)                 │
│   Estado de la fecha: LIBRE                                                │
│   [ Enviar datos de pago ]  [ Confirmar pago → ]  [ Rechazar ]             │
├────────────────────────────────────────────────────────────────────────────┤
│ ● SOL-B7C22D   hace 2h 11min                                               │
│   Andrea Justiniano · +591 776 55432 · 12 personas                         │
│   C5 · sábado 15 de agosto · llegada 09:00                                 │
│   Estado de la fecha: LIBRE          Contactada hace 1h                    │
│   [ Enviar datos de pago ]  [ Confirmar pago → ]  [ Rechazar ]             │
├────────────────────────────────────────────────────────────────────────────┤
│ ○ SOL-C1D88E   hace 3 días                          Convertida → MF-99A2F1 │
└────────────────────────────────────────────────────────────────────────────┘
```

Elementos que no son decorativos:

- **Antigüedad visible en cada fila.** Es la métrica que reduce la ventana de riesgo de la sección 3a. Dorado a partir de 1 hora, rojo a partir de 4.
- **Aviso de competencia.** Cuando dos solicitudes apuntan al mismo churrasquero y fecha, ambas lo muestran con enlace cruzado. El operador ve el conflicto antes de cobrarle a los dos.
- **Estado actual de la fecha, en vivo.** LIBRE / TOMADA. Se consulta al renderizar. Evita enviar instrucciones de pago para un día que ya se vendió — la mitigación 4.
- **"Enviar datos de pago"** genera el mensaje de WhatsApp prellenado con nombre, churrasquero, fecha, monto y datos de la cuenta. Un clic.

### 5.2 Diálogo de confirmación de pago

El único camino para crear una reserva desde una solicitud.

```
┌──────────────────────────────────────────────┐
│  Confirmar pago — SOL-A3F91C                 │
├──────────────────────────────────────────────┤
│  Roberto Ledezma · C5 · sáb 15 ago           │
│  Precio del churrasquero: Bs 350             │
│                                              │
│  Monto recibido*      [ 350.00 ]  BOB        │
│  Método*              [ Transferencia ▾ ]    │
│  Referencia / glosa   [ 00123456 ]           │
│  Comprobante          [ Subir archivo ]      │
│  Notas internas       [                    ] │
│                                              │
│  ⚠ Esto bloquea C5 el 15 de agosto.          │
│    Las demás solicitudes de esa fecha        │
│    deberán rechazarse.                       │
│                                              │
│  [ Cancelar ]        [ Confirmar reserva ]   │
└──────────────────────────────────────────────┘
```

Llama a `confirm_request_as_booking`. Si otra reserva ganó la fecha entre que se abrió el diálogo y se pulsó el botón, devuelve `DATE_TAKEN` y la UI lo dice sin ambigüedad: *"Esta fecha se confirmó a otro cliente hace instantes. Hay que devolver el pago."* Es información accionable, no un error genérico.

El comprobante va a un bucket **privado** de Supabase Storage. Nunca público: son datos financieros de terceros.

### 5.3 Calendario multi-unidad

Patrón verificado en la documentación de Hospitable y en la definición de referencia del sector: **filas = unidades, columnas = fechas**, reservas como bloques coloreados, y un panel lateral derecho donde ocurren las acciones. El objetivo declarado del patrón es la supervisión de portafolio y la detección de huecos de un vistazo.

**La simplificación que juega a favor.** Hospitable gestiona estadías de varias noches, así que necesita un motor de layout con barras que abarcan columnas y medias celdas para check-in/check-out solapados. MARFA no tiene ese problema: una reserva es un día, una celda, uno a uno.

Consecuencia directa: **no hace falta ninguna librería de calendario.** Una grilla CSS de 7 filas × 30 columnas son 210 celdas. Meter FullCalendar o react-big-calendar aquí sería traer ~100 kB y un sistema de estilos ajeno para pelear contra tus tokens. Recomendación firme: CSS Grid propio.

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Calendario MARFA      [ ‹ ] Agosto 2026 [ › ]  [Hoy]  [+ Reserva manual]  │
├──────────┬─────────────────────────────────────────────────────────────────┤
│          │ L   M   X   J   V   S   D   L   M   X   J   V   S   D   L   M   │
│          │ 3   4   5   6   7   8   9  10  11  12  13  14  15  16  17  18   │
├──────────┼─────────────────────────────────────────────────────────────────┤
│ C1  (20) │ ·   ·   ·   ·   ·  ███ ███  ·   ·   ·   ·   ·   ·   ·   ·   ·   │
│ C2  (20) │ ·   ·   ·   ·   ·  ███  ·   ·   ·   ·   ·   ·  ███ ███  ·   ·   │
│ C3  (20) │ ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   │
│ C4  (20) │ ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·  ███  ·   ·   ·   │
│ C5  (20) │ ·   ·   ·   ·   ·  ███ ███  ·   ·   ·   ·   ·  ②   ·   ·   ·   │
│ C6  (20) │ ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·  ███  ·   ·   ·   │
│ C7  (20) │ ·   ·   ·   ·   ·  ███  ·   ·   ·   ·   ·   ·  ▓▓▓  ·   ·   ·   │
└──────────┴─────────────────────────────────────────────────────────────────┘
  ███ Confirmada (pagada)   ▓▓▓ Bloqueo   ② n solicitudes pendientes   · Libre
```

**Ya no hay estado "pendiente" en la grilla.** Una celda está vendida o no lo está. El indicador `②` no es una reserva: es demanda esperando gestión, y al pulsarlo lleva a la bandeja filtrada por esa fecha. Convierte el calendario en herramienta de venta y no solo de registro.

Código de color sobre los tokens existentes:

| Estado | Fondo | Contenido |
|---|---|---|
| Libre | transparente, borde `--clr-border` | vacío; hover muestra `+` |
| Confirmada | `--clr-accent` sólido | apellido + nº personas, texto `--clr-bg` |
| Con solicitudes | transparente + badge dorado circular | número de solicitudes abiertas |
| Bloqueo | rayado diagonal `--clr-text-dim` | icono de candado |
| Hoy | borde superior 2px `--clr-gold` | — |
| Pasada | opacidad 0.4 | — |

```js
// components/admin/MultiCalendar.js
'use client';

import { useMemo, useState } from 'react';
import { eachDayOfInterval, format, isWeekend, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import styles from './MultiCalendar.module.css';

export default function MultiCalendar({ grills, rows, from, to }) {
  const [selectedCell, setSelectedCell] = useState(null);
  const days = useMemo(() => eachDayOfInterval({ start: from, end: to }), [from, to]);

  // Índice O(1): 'c3|2026-08-15' -> registro
  const index = useMemo(() => {
    const m = new Map();
    for (const r of rows) m.set(`${r.grill_slug}|${r.entry_date}`, r);
    return m;
  }, [rows]);

  return (
    <div className={styles.scroller}>
      <div
        className={styles.grid}
        style={{ '--day-count': days.length }}
        role="grid"
        aria-label="Calendario de reservas por churrasquero"
      >
        <div className={`${styles.corner} ${styles.sticky}`} />
        {days.map(d => (
          <div
            key={d.toISOString()}
            className={[
              styles.headCell,
              isWeekend(d) ? styles.weekend : '',
              isToday(d)   ? styles.today   : '',
            ].join(' ')}
          >
            <span className={styles.dow}>{format(d, 'EEEEE', { locale: es })}</span>
            <span className={styles.dom}>{format(d, 'd')}</span>
          </div>
        ))}

        {grills.map(g => (
          <Row key={g.slug} grill={g} days={days} index={index} onSelect={setSelectedCell} />
        ))}
      </div>

      {selectedCell && (
        <BookingDrawer cell={selectedCell} onClose={() => setSelectedCell(null)} />
      )}
    </div>
  );
}
```

```css
/* components/admin/MultiCalendar.module.css */
.scroller { overflow-x: auto; -webkit-overflow-scrolling: touch; }

.grid {
  display: grid;
  grid-template-columns: 140px repeat(var(--day-count), minmax(44px, 1fr));
  gap: 1px;
  background: var(--clr-border);   /* el gap dibuja las líneas de la grilla */
  min-width: max-content;
}

.sticky, .rowHeader {
  position: sticky;
  left: 0;
  z-index: var(--z-raised);
  background: var(--clr-surface);
}

.cell {
  min-height: 52px;
  background: var(--clr-bg);
  cursor: pointer;
  transition: background var(--dur-fast) var(--ease-out);
}

.cellConfirmed { background: var(--clr-accent); color: var(--clr-bg); }
.cellBlocked   {
  background: repeating-linear-gradient(
    45deg, transparent, transparent 4px,
    var(--clr-border) 4px, var(--clr-border) 8px
  );
}
.weekend { background: var(--clr-bg-warm); }
```

Notas: el `gap: 1px` sobre fondo `--clr-border` dibuja todas las líneas sin escribir un solo `border`. Ventana de 30 días, 210 celdas, sin virtualización. En móvil el mínimo de 44px fuerza scroll horizontal, que es correcto — comprimir destruiría la lectura de portafolio, que es el propósito de la vista.

### 5.4 Panel lateral y reserva manual

**Celda ocupada:**
```
Churrasquero C5 · sáb 15 ago 2026
────────────────────────────────
MF-A3F91C                Confirmada
Cliente   Roberto Ledezma
Teléfono  +591 712 34567   [WhatsApp →]
Personas  18 / 20     Llegada 10:30
Pago      Bs 350 · Transferencia · 00123456
Verificó  Andrés · 14 jul, 16:42
          [ Ver comprobante ]
────────────────────────────────
[ Cancelar reserva ]
```

**Celda libre:**
```
Churrasquero C3 · lun 10 ago 2026
────────────────────────────────
Disponible
[ + Reserva manual ]   [ 🔒 Bloquear día ]
```

**Reserva manual.** Para lo que entra por teléfono o WhatsApp sin pasar por la web. Mismos campos que el diálogo de pago, más el canal (teléfono / WhatsApp / presencial). Pasa por el mismo índice único y la misma constraint de pago: si el churrasquero ya estaba tomado, falla antes de guardar; si no se registra el pago, tampoco guarda.

Esta es la pieza que hace real la protección contra doble reserva. Sin ella el sistema es decorativo: bastaría una llamada telefónica no registrada para vender dos veces el mismo día. **El riesgo del canal paralelo es de proceso, no de código** — la herramienta existe, alguien tiene que usarla siempre.

---

## 6. Flujo del cliente

```
Web → sección Asadores → 7 tarjetas con foto
      │  pulsa C5
      ▼
┌──────────────────────────────────────────────┐
│ PASO 1 · GALERÍA                             │
│  Fotos de C5 · hasta 20 personas · Bs 350    │
│  [ Consultar disponibilidad → ]  [ WhatsApp ]│
└──────────────────────────────────────────────┘
      ▼
┌──────────────────────────────────────────────┐
│ PASO 2 · FECHA                               │
│  Churrasquero C5 · día completo               │
│  ← Agosto 2026 →                             │
│  [calendario: libre / reservado]             │
│                                              │
│  Disponibilidad actualizada. Las fechas se   │
│  apartan únicamente al confirmarse el pago.  │
└──────────────────────────────────────────────┘
      │  elige sáb 15
      ▼
┌──────────────────────────────────────────────┐
│ PASO 3 · LLEGADA Y DATOS                     │
│  Sábado 15 de agosto · día completo          │
│                                              │
│  ¿A qué hora estiman llegar?                 │
│  [ 08:00 ] [ 10:00 ] [ 12:00 ] [ 14:00 ]     │
│  o elige otra hora ▾                         │
│                                              │
│  Nombre*        Teléfono/WhatsApp*           │
│  N° personas*   Email                        │
│  Notas                                       │
│                                              │
│  Resumen: C5 · sáb 15 ago · llegada 10:00    │
│  [ Enviar solicitud ]                        │
└──────────────────────────────────────────────┘
      ▼
┌──────────────────────────────────────────────┐
│ SOLICITUD ENVIADA                            │
│  SOL-A3F91C                                  │
│                                              │
│  Todavía no es una reserva.                  │
│  Te escribimos por WhatsApp con los datos    │
│  de pago.                                    │
│                                              │
│  La fecha se aparta a tu nombre recién       │
│  cuando confirmamos el pago.                 │
│                                              │
│  [ Escribir por WhatsApp ahora → ]           │
└──────────────────────────────────────────────┘
```

### Decisiones de UX

**"Enviar solicitud", nunca "Reservar".** Es el cambio de una palabra que evita la mayoría de los malentendidos. Lo mismo con el CTA de la tarjeta: "Consultar disponibilidad", no "Reservar este asador".

**El texto de la pantalla final no se negocia.** Ver sección 3a. Es lo único que separa a un cliente que entiende el proceso de uno que llega el sábado a discutir.

**Tres pasos.** La hora de llegada cabe junto a los datos: es un campo, no una decisión de disponibilidad.

**Hora de llegada con atajos.** Cuatro botones con las horas habituales cubren casi todos los casos; desplegable para el resto. Escribir una hora a mano en móvil es fricción innecesaria.

**Colisión entre paso 2 y paso 3.** Si la fecha se confirma a otro cliente mientras el usuario llena el formulario, `submit_booking_request` devuelve `DATE_TAKEN`. La UI vuelve al calendario refrescado: *"Ese día se acaba de reservar. Estos siguen libres."*

**Rescate de conversión.** Si C5 está ocupado el sábado, mostrar "C2 y C4 disponibles ese día" en lugar de un callejón sin salida. Barato de implementar, impacto directo en ventas.

**Teléfono obligatorio, email opcional.** El canal de confirmación y de cobro es WhatsApp.

**Móvil primero.** El tráfico llegará por Instagram. Celdas de 44px, flujo en hoja deslizable a pantalla completa, no modal centrado.

---

## 7. Fix del bug de WhatsApp

**Problema.** `AsadoresSection.js` construye un único `waHref` a nivel de componente con texto fijo:

```js
// Línea ~11 — ACTUAL
const waHref = `https://wa.me/${site.whatsapp_number}?text=${encodeURIComponent('Hola, quisiera reservar un asador en MARFA')}`;
```

Se reutiliza en tres lugares: el CTA inferior de la sección y los dos botones del modal. Un cliente abre C5, pulsa "Reservar este asador", y al operador le llega un mensaje que no dice cuál. El componente **ya conoce** `activeArea` — la información existe y se descarta.

**Corrección:**

```js
const waLink = (area) => {
  const msg = area
    ? `Hola, quisiera consultar disponibilidad del ${area.name} en MARFA.`
    : 'Hola, quisiera consultar disponibilidad de un asador en MARFA.';
  return `https://wa.me/${site.whatsapp_number}?text=${encodeURIComponent(msg)}`;
};
```

```js
// 1. CTA inferior de la sección — genérico, correcto (no hay área elegida)
<a href={waLink(null)} target="_blank" rel="noopener noreferrer" className={styles.ctaBtn}>
  {data.cta_reserve}
</a>

// 2. Botón principal del modal — AQUÍ ESTÁ EL BUG
<a href={waLink(activeArea)} target="_blank" rel="noopener noreferrer" className={styles.modalBookBtn}>
  Consultar por WhatsApp →
</a>

// 3. Botón secundario — abre el flujo de solicitud con el asador ya elegido
<button onClick={() => openRequestFlow(activeArea)} className={styles.modalSecondaryBtn}>
  Consultar disponibilidad
</button>
```

**Bug relacionado en `BookingForm.js`.** El formulario general arma `Tipo: Asador` sin decir cuál. Mientras no exista el flujo nuevo, añadir un `<select>` de churrasquero cuando el tipo sea `asador`. Tras el paso 6, `BookingForm` queda solo para camping, visitas y eventos.

**Además:** `site.whatsapp_number` es `59170000000`, placeholder. Todos los botones de WhatsApp del sitio están rotos en producción ahora mismo. Corregir junto con este fix.

---

## 8. Decisiones pendientes antes del paso 1

| # | Decisión | Impacto si se retrasa |
|---|---|---|
| 1 | ¿`property_blocks` para eventos privados, o se veta? | Bloqueante: cambia el esquema |
| 2 | Precio real por día de cada churrasquero | Se usa como monto esperado al verificar pago |
| 3 | Capacidad real de c1–c7 | Va en el seed, ajustable con UPDATE |
| 4 | ¿Se cobra el total o una seña? | Si es seña, hace falta `payment_total_expected` además de `payment_amount` |
| 5 | Métodos de pago aceptados | Afecta el enum `payment_method` |
| 6 | ¿Mostrar "n personas consultaron esta fecha"? | Mitigación 3, sección 3a |
| 7 | Horas de llegada sugeridas (los 4 atajos) | Solo texto |
| 8 | Número real de WhatsApp | Bloquea cualquier despliegue |
| 9 | ¿Migrar `lib/` a TypeScript? | Cuanto más tarde, más caro |

El punto 4 merece atención: si se cobra una seña y no el total, `payment_amount` es un pago parcial y hace falta un campo para el monto esperado y el saldo. Decidirlo ahora evita una migración.

---

## 9. Riesgos abiertos

**La velocidad de verificación es ahora la métrica del negocio.** No es un detalle operativo: es la variable que determina cuántos clientes se pierden y cuántas devoluciones hay que hacer. Vale la pena medirla desde el día uno — tiempo entre `booking_requests.created_at` y `bookings.payment_verified_at`. Si la mediana supera unas horas, el modelo de pago manual está costando ventas de forma medible.

**El canal paralelo sigue siendo el riesgo número uno.** El panel tiene la herramienta de carga manual; si el operador no la usa, la web mostrará libre un día ya vendido por teléfono. Es proceso, no código. Recomendación: que el botón que genera el mensaje de confirmación al cliente sea el mismo que registra la reserva, para que el incentivo quede alineado con el dato correcto.

**Fricción de conversión.** Solicitud → esperar contacto → pagar → esperar verificación es un embudo largo para alquilar una parrilla. Se pierde gente en cada paso. El campo `request_id` en `bookings` permite medir exactamente cuánta. Si la conversión resulta baja, la respuesta es pago en línea (QR con confirmación automática), no más recordatorios manuales.

**Sin TypeScript, los estados son propensos a error.** Tres estados de reserva, cinco de solicitud, cuatro canales, cuatro métodos de pago — todo como strings sueltos en JS. Un `'confirmado'` por `'confirmed'` pasa silencioso en el cliente y falla en la base. Migrar `lib/` a `.ts` reduce esto de forma medible.

**Comprobantes de pago = datos financieros de terceros.** Bucket privado, nunca público. URLs firmadas con expiración corta. No es opcional.

---

Fuentes consultadas para el diseño del panel admin:
- [Getting Started with the Calendar — Hospitable](https://help.hospitable.com/en/articles/5625442-getting-started-with-the-calendar)
- [What is a Multi-Calendar? — Lodgify Encyclopedia](https://encyclopedia.lodgify.com/multi-calendar)
- [What is Multi-Calendar? — Hostaway](https://www.hostaway.com/glossary/multi-calendar/)
