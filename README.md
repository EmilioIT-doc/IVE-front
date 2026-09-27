# ive-store · front

React 19 + TypeScript + Vite + Tailwind v4 + Redux Toolkit (RTK Query) + React Router.

```bash
npm install
npm run dev        # http://localhost:5173  (el back debe estar corriendo en :3000)
npm run typecheck  # revisa tipos sin compilar
npm run build
```

Estructura:

```
src/
├─ app/          store de Redux, hooks tipados y rutas
├─ services/     api.ts: RTK Query base (cookies + refresh automático)
├─ features/     un folder por dominio (catalog, cart, auth…): API, slices, componentes
├─ components/   piezas reutilizables (layout, ui)
├─ pages/        una página por ruta
└─ lib/          utilidades puras (formato de dinero, colores…)
```
