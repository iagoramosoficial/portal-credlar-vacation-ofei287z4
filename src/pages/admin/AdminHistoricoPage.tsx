import React, { useState, useEffect } from 'react'
import { adminService, HistoricoItem } from '@/services/adminService'
import { exportarParaCsv } from '@/lib/export-csv'
import { formatarDataHora } from '@/lib/timezone'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { History, FileSpreadsheet, Eye, ArrowRight, User, Clock, Database, Tag } from 'lucide-react'

export const AdminHistoricoPage: React.FC = () => {
  const [historico, setHistorico] = useState<HistoricoItem[]>([])
  const [carregando, setCarregando] = useState(true)
  const [itemDetalhe, setItemDetalhe] = useState<HistoricoItem | null>(null)
  const { toast } = useToast()

  const carregarHistorico = async () => {
    try {
      setCarregando(true)
      const data = await adminService.getHistorico()
      setHistorico(data)
    } catch (err) {
      toast({
        title: 'Erro ao carregar histórico',
        description: 'Não foi possível carregar as atividades registradas.',
        variant: 'destructive',
      })
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarHistorico()
  }, [])

  const handleExportarCsv = () => {
    if (historico.length === 0) {
      toast({
        title: 'Sem registros',
        description: 'Não há alterações no histórico para exportar.',
      })
      return
    }

    exportarParaCsv(
      'historico_alteracoes',
      [
        {
          header: 'Data/Hora (Brasília)',
          accessor: (h) => formatarDataHora(h.created),
        },
        {
          header: 'Usuário',
          accessor: (h) => h.usuario,
        },
        {
          header: 'Coleção',
          accessor: (h) => h.colecao,
        },
        {
          header: 'Ação',
          accessor: (h) => h.acao,
        },
        {
          header: 'Registro ID',
          accessor: (h) => h.registro_id,
        },
        {
          header: 'Antes (JSON)',
          accessor: (h) => (h.antes ? JSON.stringify(h.antes) : ''),
        },
        {
          header: 'Depois (JSON)',
          accessor: (h) => (h.depois ? JSON.stringify(h.depois) : ''),
        },
      ],
      historico,
    )

    toast({
      title: 'Planilha exportada',
      description: 'O arquivo CSV do histórico foi gerado com sucesso.',
    })
  }

  const getAcaoBadge = (acao: string) => {
    switch (acao) {
      case 'criar':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            Criação
          </span>
        )
      case 'editar':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            Edição
          </span>
        )
      case 'excluir':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
            Exclusão
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-neutral-800 text-neutral-300">
            {acao}
          </span>
        )
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-brand-lilac" />
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Histórico de Alterações
            </h1>
          </div>
          <p className="text-xs md:text-sm text-neutral-400 mt-1">
            Auditoria completa de modificações realizadas no conteúdo do site (horário de Brasília).
          </p>
        </div>

        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportarCsv}
            disabled={carregando || historico.length === 0}
            className="border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-white text-xs flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Exportar planilha (CSV)
          </Button>
        </div>
      </div>

      {/* Tabela do Histórico */}
      {carregando ? (
        <div className="p-12 flex flex-col items-center justify-center text-neutral-400 gap-3">
          <div className="w-8 h-8 border-2 border-brand-lilac border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Carregando histórico de auditoria...</p>
        </div>
      ) : historico.length === 0 ? (
        <div className="p-12 text-center bg-neutral-900/50 border border-neutral-800 rounded-2xl">
          <p className="text-sm text-neutral-400">Nenhuma alteração registrada ainda.</p>
        </div>
      ) : (
        <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-950/60 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-900/80 text-neutral-400 uppercase text-[10px] tracking-wider border-b border-neutral-800">
                <tr>
                  <th className="px-4 py-3">Data / Hora (Brasília)</th>
                  <th className="px-4 py-3">Usuário</th>
                  <th className="px-4 py-3">Coleção</th>
                  <th className="px-4 py-3">Ação</th>
                  <th className="px-4 py-3 text-right">Comparação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/70 text-neutral-300">
                {historico.map((item) => (
                  <tr key={item.id} className="hover:bg-neutral-900/50 transition duration-150">
                    <td className="px-4 py-3.5 whitespace-nowrap text-neutral-400 font-medium">
                      {formatarDataHora(item.created)}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-white font-medium">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-neutral-500" />
                        {item.usuario}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded font-mono text-[11px] bg-neutral-900 border border-neutral-800 text-neutral-300">
                        {item.colecao}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">{getAcaoBadge(item.acao)}</td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setItemDetalhe(item)}
                        className="text-xs text-brand-orange hover:text-brand-yellow hover:bg-neutral-800 h-8 px-2.5"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Ver Antes / Depois
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Antes e Depois */}
      <Dialog open={!!itemDetalhe} onOpenChange={(open) => !open && setItemDetalhe(null)}>
        <DialogContent className="bg-neutral-900 border border-neutral-800 text-neutral-100 max-w-3xl max-h-[85vh] flex flex-col font-sans">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-brand-orange" />
              <DialogTitle className="text-base font-bold text-white">
                Detalhes da Alteração
              </DialogTitle>
            </div>
            <DialogDescription className="text-neutral-400 text-xs">
              Registro realizado em {itemDetalhe ? formatarDataHora(itemDetalhe.created) : ''} por{' '}
              <strong className="text-neutral-200">{itemDetalhe?.usuario}</strong> na coleção{' '}
              <strong className="text-neutral-200">{itemDetalhe?.colecao}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Painel Antes */}
              <div className="flex flex-col rounded-xl border border-neutral-800 bg-neutral-950 p-4">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800 mb-3">
                  <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                    Estado Anterior (Antes)
                  </span>
                </div>
                {itemDetalhe?.antes ? (
                  <pre className="text-[11px] font-mono text-neutral-300 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed bg-neutral-900/50 p-3 rounded-lg border border-neutral-800/60 max-h-80">
                    {JSON.stringify(itemDetalhe.antes, null, 2)}
                  </pre>
                ) : (
                  <p className="text-xs text-neutral-500 italic py-6 text-center">
                    (Sem dados anteriores — criação de registro)
                  </p>
                )}
              </div>

              {/* Painel Depois */}
              <div className="flex flex-col rounded-xl border border-neutral-800 bg-neutral-950 p-4">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800 mb-3">
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                    Novo Estado (Depois)
                  </span>
                </div>
                {itemDetalhe?.depois ? (
                  <pre className="text-[11px] font-mono text-neutral-300 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed bg-neutral-900/50 p-3 rounded-lg border border-neutral-800/60 max-h-80">
                    {JSON.stringify(itemDetalhe.depois, null, 2)}
                  </pre>
                ) : (
                  <p className="text-xs text-neutral-500 italic py-6 text-center">
                    (Registro removido na exclusão)
                  </p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
