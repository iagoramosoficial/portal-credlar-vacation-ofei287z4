import React, { createContext, useContext, useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'

export interface UsuarioAdmin {
  id: string
  email: string
  nome: string
  papel: 'admin' | 'dho'
  created?: string
}

interface AdminAuthContextType {
  usuario: UsuarioAdmin | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<UsuarioAdmin | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Sincronizar estado inicial com o PocketBase authStore
    const checkAuth = () => {
      try {
        const isValid = pb.authStore.isValid
        const model = pb.authStore.record

        // Verificar se é da coleção usuarios_admin
        if (isValid && model && model.collectionName === 'usuarios_admin') {
          setUsuario({
            id: model.id,
            email: model.email || '',
            nome: model.nome || model.email || 'Usuário',
            papel: (model.papel as 'admin' | 'dho') || 'dho',
            created: model.created,
          })
        } else {
          setUsuario(null)
        }
      } catch {
        setUsuario(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    const unsubscribe = pb.authStore.onChange(() => {
      checkAuth()
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    // Autentica especificamente na coleção usuarios_admin
    const authData = await pb.collection('usuarios_admin').authWithPassword(email.trim(), password)
    const model = authData.record

    setUsuario({
      id: model.id,
      email: model.email || '',
      nome: model.nome || model.email || 'Usuário',
      papel: (model.papel as 'admin' | 'dho') || 'dho',
      created: model.created,
    })
  }

  const logout = () => {
    pb.authStore.clear()
    setUsuario(null)
  }

  return (
    <AdminAuthContext.Provider
      value={{
        usuario,
        isLoading,
        login,
        logout,
        isAuthenticated: !!usuario && pb.authStore.isValid,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error('useAdminAuth deve ser usado dentro de um AdminAuthProvider')
  }
  return context
}
