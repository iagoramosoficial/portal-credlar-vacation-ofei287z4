/* Main App Component - Handles routing (using react-router-dom), query client and other providers - use this file to add all routes */
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Index from './pages/Index'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import { AdminAuthProvider } from '@/contexts/AdminAuthContext'
import { VersionProvider } from '@/contexts/VersionContext'
import { FaixaNovaVersao } from '@/components/FaixaNovaVersao'
import { AdminLayout } from '@/pages/admin/AdminLayout'
import { AdminLoginPage } from '@/pages/admin/AdminLoginPage'
import { AdminHomePage } from '@/pages/admin/AdminHomePage'
import { AdminSitePage } from '@/pages/admin/AdminSitePage'
import { AdminCardsPage } from '@/pages/admin/AdminCardsPage'
import { AdminHistoricoPage } from '@/pages/admin/AdminHistoricoPage'
import { AdminConfiguracoesPage } from '@/pages/admin/AdminConfiguracoesPage'
import { AdminLideresPage } from '@/pages/admin/AdminLideresPage'
import PrivacidadePage from './pages/PrivacidadePage'
import CadastroLiderPage from './pages/CadastroLiderPage'

// ONLY IMPORT AND RENDER WORKING PAGES, NEVER ADD PLACEHOLDER COMPONENTS OR PAGES IN THIS FILE
// AVOID REMOVING ANY CONTEXT PROVIDERS FROM THIS FILE (e.g. TooltipProvider, Toaster, Sonner)

const App = () => (
  <BrowserRouter>
    <TooltipProvider>
      <AdminAuthProvider>
        <VersionProvider>
          <Toaster />
          <Sonner />
          <FaixaNovaVersao />
          <Routes>
            {/* Rotas Públicas */}
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/privacidade" element={<PrivacidadePage />} />
            </Route>

            {/* Rota Pública de Cadastro e Autorização de Imagem */}
            <Route path="/cadastro/:token" element={<CadastroLiderPage />} />

            {/* Rota Pública do Login Admin */}
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Rotas Protegidas do Painel /admin */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminHomePage />} />
              <Route path="lideres" element={<AdminLideresPage />} />
              <Route path="site" element={<AdminSitePage />} />
              <Route path="cards" element={<AdminCardsPage />} />
              <Route path="historico" element={<AdminHistoricoPage />} />
              <Route path="configuracoes" element={<AdminConfiguracoesPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </VersionProvider>
      </AdminAuthProvider>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
