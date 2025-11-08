# 🚀 Guía de Deploy - Kivi V2 Frontend

## Prerrequisitos

1. **Cuenta de Vercel** (puedes usar GitHub para login)
2. **Repositorio en GitHub** con el código
3. **Backend desplegado** en Google Cloud Run (necesitas la URL)

## Paso 1: Preparar Variables de Entorno

Crea un archivo `.env.production` con:

```bash
VITE_API_URL=https://tu-backend-url.run.app
```

**⚠️ NO subas este archivo a Git!** Ya está en `.gitignore`

## Paso 2: Deploy con Vercel CLI

### Instalar Vercel CLI (si no lo tienes)

```bash
npm install -g vercel
```

### Login

```bash
vercel login
```

### Deploy

```bash
# Desde el directorio v2-frontend
cd /Users/danteparodiwerth/Desktop/kivi-software/v2-frontend

# Preview deployment
vercel

# Production deployment
vercel --prod
```

## Paso 3: Deploy vía Vercel Dashboard (Recomendado)

### 1. Ir a [vercel.com](https://vercel.com)

### 2. Conectar GitHub

- Click en "Add New Project"
- Importa tu repositorio `kivi-software`
- Selecciona el directorio `v2-frontend` como Root Directory

### 3. Configurar Build Settings

```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### 4. Configurar Variables de Entorno

En la configuración del proyecto, agregar:

```
Variable Name: VITE_API_URL
Value: https://kivi-backend-xxxxx-uc.a.run.app
Environment: Production
```

### 5. Deploy

Click en "Deploy" y Vercel construirá y desplegará automáticamente.

## Paso 4: Configurar Dominio Custom (Opcional)

### Si tienes un dominio propio:

1. En Vercel Dashboard → Settings → Domains
2. Agregar tu dominio (ej: `www.kivi.cl`)
3. Configurar DNS según las instrucciones de Vercel:

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

## Paso 5: Verificar CORS en Backend

Asegúrate que tu backend en Google Cloud Run tenga configurado:

```bash
gcloud run services update kivi-backend \
    --region=us-central1 \
    --set-env-vars="ALLOWED_ORIGINS=https://tu-app.vercel.app,https://www.kivi.cl"
```

## Paso 6: Testing

```bash
# Verificar que el build funciona localmente
npm run build
npm run preview

# Probar la app en localhost:4173
```

## Automatic Deployments

Vercel automáticamente desplegará:

- **Production**: Cada push a la rama `main`
- **Preview**: Cada push a otras ramas o PRs

## Variables de Entorno en Vercel

Puedes configurar diferentes variables para diferentes entornos:

```
# Production
VITE_API_URL=https://kivi-backend-prod.run.app

# Preview
VITE_API_URL=https://kivi-backend-dev.run.app

# Development
VITE_API_URL=http://localhost:5000
```

## Troubleshooting

### Error: "Failed to fetch"

**Problema**: El frontend no puede conectarse al backend

**Solución**:
1. Verificar que `VITE_API_URL` esté configurado correctamente
2. Verificar CORS en el backend
3. Verificar que el backend esté corriendo

```bash
# Probar endpoint del backend
curl https://tu-backend.run.app/api/categories
```

### Error: "Route not found"

**Problema**: Las rutas del React Router no funcionan al refrescar la página

**Solución**: Verificar que `vercel.json` tenga el rewrite:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Build falla en Vercel

**Problema**: `npm run build` falla

**Solución**:
1. Verificar que todas las dependencias estén en `package.json`
2. Probar build localmente primero
3. Revisar logs en Vercel Dashboard

```bash
# Limpiar y reinstalar
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Imágenes no se cargan

**Problema**: Las fotos de productos no se ven

**Solución**: Verificar que `getPhotoUrl()` esté funcionando correctamente en `ProductCard.jsx`

## Monitoreo

### Ver logs en tiempo real

En Vercel Dashboard → Deployments → Tu deployment → Function Logs

### Analytics

Vercel proporciona analytics automáticos:
- Tiempo de carga
- Core Web Vitals
- Visitas por página

## Rollback

Si algo sale mal:

```bash
# Via CLI
vercel rollback

# Via Dashboard
Deployments → Select previous deployment → Promote to Production
```

## Performance Tips

1. **Lazy Loading**: Las rutas ya están configuradas con lazy loading
2. **Code Splitting**: Vite lo hace automáticamente
3. **Image Optimization**: Usa formatos modernos (WebP)
4. **Caching**: Vercel cachea automáticamente los assets

## Costos

Vercel Free Tier incluye:
- ✅ 100GB bandwidth
- ✅ Unlimited deployments
- ✅ Automatic HTTPS
- ✅ Git integration
- ✅ Preview deployments

**Estimado**: $0/mes (con plan gratuito)

## Siguiente Paso

Después de desplegar:
1. Probar todas las funcionalidades
2. Configurar monitoreo (Sentry, LogRocket, etc.)
3. Configurar analytics (Google Analytics, Plausible, etc.)
4. Configurar SEO (meta tags, sitemap, robots.txt)

## Enlaces Útiles

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Documentation](https://vitejs.dev)
- [React Router on Vercel](https://vercel.com/guides/deploying-react-with-vercel)

