/**
 * Utilitário para geração e download de arquivos CSV
 */

export interface CsvColumn<T> {
  header: string
  accessor: (item: T) => string | number | boolean | null | undefined
}

function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '""'
  const str = String(val).replace(/"/g, '""')
  return `"${str}"`
}

export function exportarParaCsv<T>(
  nomeArquivoBase: string,
  colunas: CsvColumn<T>[],
  dados: T[],
): void {
  const cabecalho = colunas.map((c) => escapeCsvField(c.header)).join(';')
  const linhas = dados.map((item) =>
    colunas.map((col) => escapeCsvField(col.accessor(item))).join(';'),
  )

  // Adiciona BOM (\uFEFF) para que o Excel abra com acentuação correta em UTF-8
  const conteudoCsv = '\uFEFF' + [cabecalho, ...linhas].join('\r\n')

  const blob = new Blob([conteudoCsv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const dataHoje = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `${nomeArquivoBase}_${dataHoje}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
