import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react'

export const AdminLoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAdminAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  // Se já autenticado, vai para a página pretendida ou /admin
  React.useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/admin'
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, location])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    if (!email || !password) {
      setErro('Por favor, preencha todos os campos.')
      return
    }

    try {
      setCarregando(true)
      await login(email, password)
      const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/admin'
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Credenciais inválidas. Verifique seu e-mail e senha.'
      setErro(
        msg.includes('Failed to authenticate') || msg.includes('400')
          ? 'E-mail ou senha incorretos.'
          : msg,
      )
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-brand-red/15 via-brand-orange/10 to-brand-lilac/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="w-full max-w-md bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10 backdrop-blur-sm">
        {/* Top Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-brand flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-brand-red/20 mb-4">
            CV
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Painel Administrativo
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Acesso restrito para gestão do portal
          </p>
        </div>

        {erro && (
          <div className="mb-6 p-3 rounded-lg bg-red-950/50 border border-red-800/80 flex items-center gap-3 text-red-200 text-xs">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-medium text-neutral-300">
              E-mail de Acesso
            </Label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                id="email"
                type="email"
                placeholder="seu.email@credlar.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="pl-9 bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-medium text-neutral-300">
              Senha
            </Label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="pl-9 bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={carregando}
            className="w-full mt-2 bg-gradient-brand hover:opacity-95 text-white font-medium py-2.5 transition shadow-md shadow-brand-red/20 border-0 flex items-center justify-center gap-2"
          >
            {carregando ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Entrar no Painel
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-8 pt-4 border-t border-neutral-800/80 text-center">
          <p className="text-[11px] text-neutral-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
            Área segura e auditada. Cadastro sob demanda pelo superadministrador.
          </p>
        </div>
      </div>
    </div>
  )
}
