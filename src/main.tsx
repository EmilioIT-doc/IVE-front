import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { RouterProvider } from 'react-router'
import { router } from './app/router'
import { FloatingActions } from './components/layout/FloatingActions'
import { store } from './app/store'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
      {/* Fuera de las rutas: se ve en todas las pantallas */}
      <FloatingActions />
    </Provider>
  </StrictMode>,
)
