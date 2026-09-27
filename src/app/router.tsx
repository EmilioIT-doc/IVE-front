import { createBrowserRouter } from 'react-router'
import { Layout } from '../components/layout/Layout'
import { RequireAdmin } from '../components/layout/RequireAdmin'
import { RequireAuth } from '../components/layout/RequireAuth'
import { AdminCategoriesPage } from '../pages/admin/AdminCategoriesPage'
import { AdminCategoryPage } from '../pages/admin/AdminCategoryPage'
import { AdminCouponsPage } from '../pages/admin/AdminCouponsPage'
import { AdminLayout } from '../pages/admin/AdminLayout'
import { AdminProductPage } from '../pages/admin/AdminProductPage'
import { AdminProductsPage } from '../pages/admin/AdminProductsPage'
import { AdminReviewsPage } from '../pages/admin/AdminReviewsPage'
import { AdminSitePage } from '../pages/admin/AdminSitePage'
import { AccountPage } from '../pages/AccountPage'
import { CatalogPage } from '../pages/CatalogPage'
import { CheckoutPage } from '../pages/CheckoutPage'
import { ComingSoonPage } from '../pages/ComingSoonPage'
import { HomePage } from '../pages/HomePage'
import { LoginPage } from '../pages/LoginPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { OrderConfirmationPage } from '../pages/OrderConfirmationPage'
import { OrderDetailPage } from '../pages/OrderDetailPage'
import { ProductPage } from '../pages/ProductPage'
import { RegisterPage } from '../pages/RegisterPage'
import { VerifyPage } from '../pages/VerifyPage'

export const router = createBrowserRouter([
  // Tienda: con header, footer y bolsa
  {
    element: <Layout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/tienda', element: <CatalogPage /> },
      // /tienda/mujer · /tienda/gym · /tienda/mujer/gym (ver CatalogPage)
      { path: '/tienda/:first', element: <CatalogPage /> },
      { path: '/tienda/:first/:second', element: <CatalogPage /> },
      { path: '/producto/:slug', element: <ProductPage /> },
      { path: '/pedido/:id', element: <RequireAuth><OrderConfirmationPage /></RequireAuth> },
      { path: '/cuenta', element: <RequireAuth><AccountPage /></RequireAuth> },
      { path: '/cuenta/pedidos/:id', element: <RequireAuth><OrderDetailPage /></RequireAuth> },
      { path: '/ayuda/*', element: <ComingSoonPage title="Ayuda" /> },
      // Panel de administración (solo rol admin)
      {
        path: '/admin',
        element: <RequireAdmin><AdminLayout /></RequireAdmin>,
        children: [
          { index: true, element: <AdminProductsPage /> },
          { path: 'productos/nuevo', element: <AdminProductPage /> },
          { path: 'productos/:id', element: <AdminProductPage /> },
          { path: 'categorias', element: <AdminCategoriesPage /> },
          { path: 'categorias/:id', element: <AdminCategoryPage /> },
          { path: 'inicio', element: <AdminSitePage /> },
          { path: 'cupones', element: <AdminCouponsPage /> },
          { path: 'resenas', element: <AdminReviewsPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  // Pantallas de enfoque: sin el header de la tienda (así vienen en el diseño)
  { path: '/login', element: <LoginPage /> },
  { path: '/registro', element: <RegisterPage /> },
  { path: '/verificar', element: <VerifyPage /> },
  { path: '/checkout', element: <RequireAuth><CheckoutPage /></RequireAuth> },
])
