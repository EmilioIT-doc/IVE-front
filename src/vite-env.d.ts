/// <reference types="vite/client" />

// Variables de entorno del front (deben empezar con VITE_ para que Vite las exponga)
interface ImportMetaEnv {
  readonly VITE_WHATSAPP_NUMBER?: string
}
