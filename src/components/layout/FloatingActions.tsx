import { useEffect, useState } from 'react'

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER ?? ''
const WHATSAPP_TEXT = 'Hola, tengo una pregunta sobre IVE'
// Sin número configurado, wa.me abre WhatsApp para elegir el contacto
const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}?text=${encodeURIComponent(WHATSAPP_TEXT)}`

/** Botones flotantes abajo a la derecha: subir al inicio y WhatsApp. */
export function FloatingActions() {
  const [showTop, setShowTop] = useState(false)

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTop = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }

  return (
    <div className="pointer-events-none fixed right-5 bottom-5 z-40 flex flex-col items-center gap-3 md:right-8 md:bottom-8">
      <button
        type="button"
        onClick={scrollTop}
        aria-label="Subir al inicio"
        tabIndex={showTop ? 0 : -1}
        aria-hidden={!showTop}
        className={`flex size-12 items-center justify-center rounded-full bg-bone text-ink shadow-[0_6px_20px_rgba(26,26,24,0.18)] ring-1 ring-line transition-[opacity,translate,background-color] duration-300 ease-out hover:bg-white ${
          showTop ? 'pointer-events-auto translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
        }`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 19V5" />
          <path d="M6 11l6-6 6 6" />
        </svg>
      </button>

      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Escríbenos por WhatsApp (se abre en otra pestaña)"
        className="group pointer-events-auto flex size-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-[0_8px_24px_rgba(37,211,102,0.35)] transition-transform duration-300 ease-out hover:scale-110"
      >
        <svg width="28" height="28" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
          <path d="M16.04 3C9.4 3 4 8.36 4 14.97c0 2.11.56 4.17 1.62 5.99L4 29l8.25-1.6a12.1 12.1 0 0 0 3.79.61h.01C22.68 28.01 28 22.64 28 16.03 28 12.83 26.75 9.83 24.48 7.57A11.9 11.9 0 0 0 16.04 3Zm0 22.83h-.01a9.9 9.9 0 0 1-3.6-.68l-.26-.1-4.9.95.98-4.72-.17-.28a9.78 9.78 0 0 1-1.52-5.23c0-5.42 4.44-9.83 9.49-9.83 2.63 0 5.1 1.02 6.96 2.87a9.73 9.73 0 0 1 2.88 6.93c0 5.42-4.43 10.09-9.85 10.09Zm5.4-7.37c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.46-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.57-.49-.5-.67-.5h-.57c-.2 0-.52.08-.79.37-.27.3-1.04 1.01-1.04 2.47 0 1.46 1.06 2.87 1.21 3.07.15.2 2.09 3.18 5.06 4.46.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.75-.71 2-1.4.25-.69.25-1.28.17-1.4-.07-.12-.27-.2-.57-.35Z" />
        </svg>
        <span className="pointer-events-none absolute right-full mr-3 hidden rounded-full bg-ink px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-bone opacity-0 transition-opacity duration-200 group-hover:opacity-100 md:block">
          ¿Dudas? Escríbenos
        </span>
      </a>
    </div>
  )
}
