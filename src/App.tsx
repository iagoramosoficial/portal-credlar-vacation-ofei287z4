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
import { AdminHallPage } from '@/pages/admin/AdminHallPage'
import PrivacidadePage from './pages/PrivacidadePage'
import CadastroLiderPage from './pages/CadastroLiderPage'
import HallDaFamaPage from './pages/HallDaFamaPage'
import AgendaPage from './pages/AgendaPage'
import RedirecionamentoLinkCurtoPage from './pages/RedirecionamentoLinkCurtoPage'
import { AdminAgendaPage } from './pages/admin/AdminAgendaPage'

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
              <Route path="/agenda" element={<AgendaPage />} />
              <Route path="/privacidade" element={<PrivacidadePage />} />
              <Route path="/hall-da-fama" element={<HallDaFamaPage />} />
            </Route>

            {/* Rota Pública de Redirecionamento de Link Curto */}
            <Route path="/r/:apelido" element={<RedirecionamentoLinkCurtoPage />} />

            {/* Rota Pública de Cadastro e Autorização de Imagem */}
            <Route path="/cadastro/:token" element={<CadastroLiderPage />} />

            {/* Rota Pública do Login Admin */}
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Rotas Protegidas do Painel /admin */}
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminHomePage />} />
              <Route path="/admin/agenda" element={<AdminAgendaPage />} />
              <Route path="/admin/hall" element={<AdminHallPage />} />
              <Route path="/admin/lideres" element={<AdminLideresPage />} />
              <Route path="/admin/site" element={<AdminSitePage />} />
              <Route path="/admin/cards" element={<AdminCardsPage />} />
              <Route path="/admin/historico" element={<AdminHistoricoPage />} />
              <Route path="/admin/configuracoes" element={<AdminConfiguracoesPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </VersionProvider>
      </AdminAuthProvider>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
