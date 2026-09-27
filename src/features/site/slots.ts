import type { SiteSlot } from './siteApi'

/**
 * Cómo se muestra cada foto en el home. Las medidas salen del diseño:
 *  - Portada: mitad derecha del hero → 720 × 760 px en una pantalla de 1440, 960 × 760 en una de 1920
 *    (se ensancha con la pantalla; la altura es fija) y ~390 × 420 en celular.
 *  - Editorial: mitad izquierda del bloque → 656 × 560 px (en celular ~390 × 320).
 * La foto llena el cuadro (object-cover): lo que sobra se recorta parejo desde el centro.
 */
export const SLOT_INFO: Record<
  SiteSlot,
  {
    title: string
    where: string
    recommended: string
    minimum: string
    tip: string
    /** Tamaños reales en los que aparece (el 1º es donde se edita el encuadre) */
    frames: { label: string; aspect: number; previewWidth: number }[] // aspect = ancho / alto
    fallbackLabel: string
    fallbackColor: string
  }
> = {
  home_hero: {
    title: 'Portada del inicio',
    where: 'La foto grande a la derecha de “Lo esencial, bien hecho.”, lo primero que ve la gente.',
    recommended: '2000 × 2000 px (cuadrada)',
    minimum: 'Mínimo 1400 × 1400 px para que no se vea borrosa en pantallas grandes.',
    tip: 'En pantallas anchas se recorta un poco arriba y abajo, y en celular a los lados: deja lo importante al centro.',
    frames: [
      { label: 'Computadora (1440 px)', aspect: 720 / 760, previewWidth: 200 },
      { label: 'Pantalla grande (1920 px)', aspect: 960 / 760, previewWidth: 250 },
      { label: 'Celular', aspect: 390 / 420, previewWidth: 120 },
    ],
    fallbackLabel: '[Foto de campaña]',
    fallbackColor: '#d9d2c5',
  },
  home_editorial: {
    title: 'Foto editorial',
    where: 'El bloque “Del día a día al gym”, justo arriba del footer.',
    recommended: '1600 × 1400 px (horizontal, proporción 8:7)',
    minimum: 'Mínimo 1320 × 1130 px.',
    tip: 'Se ve casi igual en computadora y en celular; se recorta muy poco.',
    frames: [
      { label: 'Computadora', aspect: 656 / 560, previewWidth: 260 },
      { label: 'Celular', aspect: 390 / 320, previewWidth: 140 },
    ],
    fallbackLabel: '[Foto editorial · Gym]',
    fallbackColor: '#cfc7b8',
  },
}
