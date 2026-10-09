# Tarjetas · páginas de enlaces

Panel para crear páginas tipo Linktree para cada cliente (las que abre el QR / NFC de la tarjeta).

- **Panel:** `https://<tu-usuario>.github.io/<repo>/admin`
- **Página de un cliente:** `https://<tu-usuario>.github.io/<repo>/<link-del-cliente>`

## 1. Supabase (base de datos + login)
1. Crea una cuenta y un proyecto gratis en https://supabase.com.
2. **SQL Editor → New query**: pega todo el contenido de `supabase/schema.sql` y dale **Run**.
3. **Authentication → Sign In / Providers**: desactiva **"Allow new users to sign up"** (así nadie más puede crear cuenta).
4. **Authentication → Users → Add user → Create new user**: tu correo y contraseña (marca "Auto Confirm User").
5. **Project Settings → API**: copia el **Project URL** y la **anon public key**.

## 2. Probar en tu computador
```bash
cp .env.example .env      # y pega ahí la URL y la anon key
npm install
npm run dev               # abre http://localhost:5173/admin
```

## 3. Publicar en GitHub Pages
1. Crea un repositorio en GitHub (ej. `tarjetas`) y sube este proyecto a la rama `main`.
2. En el repo: **Settings → Secrets and variables → Actions → New repository secret**, crea:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. **Settings → Pages → Source: GitHub Actions**.
4. Haz cualquier push (o **Actions → Publicar en GitHub Pages → Run workflow**). En ~1 minuto queda en línea.

Después de esto, todo lo que edites en el panel se ve al instante: no hay que volver a publicar.

## 4. Grabar las tarjetas
En el panel, cada cliente tiene un botón **Copiar link**. Ese es el link que grabas en el chip NFC y con el que generas el QR.

> Si cambias el "link de la página" de un cliente, las tarjetas ya grabadas con el link viejo dejan de funcionar.

## Dominio propio (más adelante)
Crea `public/CNAME` con tu dominio (ej. `tarjetas.com`), configura el DNS según la guía de GitHub Pages y pon el dominio en **Settings → Pages**. GitHub redirige automáticamente las direcciones `github.io` viejas al dominio nuevo, así que las tarjetas ya grabadas siguen funcionando.
