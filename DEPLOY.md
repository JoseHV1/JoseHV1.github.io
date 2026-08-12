# Desplegar el portfolio

Sitio estático (HTML/CSS/JS puro, sin build step). Se despliega igual que pixlite/markconverted: **Docker Compose en Coolify** para build/deploy automático, **Apache** como puerta de entrada pública con SSL real.

## Estado actual

- Repo público: `github.com/JoseHV1/JoseHV1.github.io` (no necesita deploy key).
- Proyecto y aplicación **ya creados en Coolify**, sin desplegar todavía — el repo remoto aún no tiene `Dockerfile`/`docker-compose.yml`/`nginx.conf` porque **no se ha hecho push** (instrucción explícita: hay un rediseño en progreso sin comitear/subir todavía).
- Puerto fijo asignado: `3014`.

## 1. Cuando decidas subir el rediseño

```bash
cd /home/dev/personal-projects/portfolio
git add -A
git commit -m "..."
git push origin main
```

Después del push, dispara el primer deploy en Coolify (UI, o pídemelo).

## 2. DNS

`jose-hernandez.dev` (dominio raíz, sin subdominio) hoy resuelve a IPs de Cloudflare (proxy activo). Igual que hicimos con pixlite, edita el registro a **DNS only** (nube gris) apuntando a `147.93.3.184`:

| Host | Tipo | Valor | Proxy |
|---|---|---|---|
| `jose-hernandez.dev` (raíz/@) | A | `147.93.3.184` | DNS only |

## 3. Apache (puerta de entrada + SSL)

```bash
sudo tee /etc/apache2/sites-available/portfolio.conf > /dev/null <<'EOF'
<VirtualHost *:80>
    ServerName jose-hernandez.dev
    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:3014/
    ProxyPassReverse / http://127.0.0.1:3014/
    ErrorLog ${APACHE_LOG_DIR}/portfolio_error.log
    CustomLog ${APACHE_LOG_DIR}/portfolio_access.log combined
</VirtualHost>
EOF

sudo a2ensite portfolio.conf
sudo systemctl reload apache2
sudo certbot --apache -d jose-hernandez.dev
```

> Nota: `n8n.jose-hernandez.dev`, `coolify.jose-hernandez.dev`, `pixlite.jose-hernandez.dev`, etc. son subdominios independientes — este vhost solo reclama el dominio raíz (`jose-hernandez.dev` sin prefijo), no les afecta.

## 4. Verificar

```bash
curl -I https://jose-hernandez.dev
```

## Flujo de trabajo día a día

```
código local → git push origin main → Coolify reconstruye y redespliega automáticamente
```

Falta activar el webhook de auto-deploy (igual que pixlite/markconverted) — se hace después del primer push, cuando ya haya algo que desplegar.
