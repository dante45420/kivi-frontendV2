# Kivi V2.0 Frontend

Frontend moderno y optimizado para el Personal Shopper de Lo Valledor.

## 🎨 Características

- **React 18** + **Vite 5** - Build rápido y HMR
- **Colores pasteles** del logo Kivi
- **Diseño minimalista** - Mínimos clicks necesarios
- **Kivi el perro 🐕** - Asistente interactivo con IA
- **Responsive** - Mobile-first
- **Sin dependencias** pesadas - Solo React Router

## 🏗️ Estructura

```
src/
├── components/          # Componentes reutilizables
│   ├── Navbar.jsx
│   ├── KiviHelper.jsx  # 🐕 Asistente interactivo
│   ├── Modal.jsx
│   ├── Loader.jsx
│   └── ImageUploader.jsx
│
├── pages/              # Páginas principales
│   ├── Dashboard.jsx   # Vista general
│   ├── Products.jsx    # Gestión productos
│   ├── Orders.jsx      # Parseo y gestión pedidos
│   ├── Customers.jsx   # Gestión clientes
│   ├── Accounting.jsx  # Contabilidad simplificada
│   ├── Login.jsx
│   └── public/         # Páginas públicas
│       ├── Home.jsx    # Landing
│       ├── Catalog.jsx # Catálogo con carrito
│       └── About.jsx   # Sobre nosotros
│
├── api/                # Clientes API
│   ├── client.js       # Cliente base
│   ├── products.js
│   ├── orders.js
│   ├── customers.js
│   ├── payments.js
│   └── kivi.js        # API de Kivi
│
├── hooks/             # React hooks custom
│   └── useCart.js     # Carrito localStorage
│
└── styles/
    └── globals.css    # Estilos globales
```

## 🚀 Desarrollo Local

### 1. Instalar dependencias

```bash
cd v2-frontend
npm install
```

### 2. Configurar variables de entorno

Crear archivo `.env`:

```env
VITE_API_URL=http://localhost:5000
```

### 3. Ejecutar en desarrollo

```bash
npm run dev
```

La app estará en `http://localhost:3000`

## 🎨 Colores Kivi

```css
--kivi-green: #A8D5BA        /* Verde principal */
--kivi-green-dark: #88C4A8   /* Verde oscuro */
--kivi-orange: #FFD4A3       /* Naranja acento */
--kivi-cream: #FFF9F0        /* Crema fondo */
--kivi-blue-soft: #B3D9FF    /* Azul suave */
```

## 📦 Build para Producción

```bash
npm run build
```

Los archivos estarán en `dist/`

## 🐕 Kivi Helper

El asistente interactivo Kivi:

- **Activo por defecto**: Muestra tips cada 30 segundos
- **Toggle**: Click en el botón circular para activar/desactivar
- **Chat**: Expandir para conversar con Kivi (usa OpenAI)
- **Contextual**: Da información sobre productos, plataforma y marca

## 🛒 Carrito Web

Sistema de carrito sin login:

- Almacenado en **localStorage**
- Cliente ingresa datos al finalizar
- Se crea pedido en estado "draft"
- Notificación por WhatsApp al admin
- Admin puede editar antes de emitir

## 🎯 Próximos pasos

Ver `DEPLOYMENT.md` para instrucciones de deployment a Vercel.

