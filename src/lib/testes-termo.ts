import {
  formatarConteudoTermoParaHtml,
  converterTextoPuroParaParagrafos,
  converterConteudoMistoParaHtml,
  contemMarcacaoHtml,
} from '@/components/TermoConteudo'

/**
 * Testes automatizados para a formatação de termos legais nos três casos:
 * 1. Texto puro (quebras duplas viram <p>, quebras simples viram <br />)
 * 2. HTML puro (semântica e tags HTML preservadas)
 * 3. Conteúdo misto (texto corrido com quebras de linha + lista HTML <ul>/<li> no meio)
 * + Sanitização contra scripts injetados
 */
export function executarTestesTermoConteudo(): {
  total: number
  passou: number
  falhou: number
  detalhes: { nome: string; sucesso: boolean; mensagem?: string }[]
} {
  const detalhes: { nome: string; sucesso: boolean; mensagem?: string }[] = []

  function assert(nome: string, condicao: boolean, mensagemErro?: string) {
    if (condicao) {
      detalhes.push({ nome, sucesso: true })
    } else {
      detalhes.push({ nome, sucesso: false, mensagem: mensagemErro || 'Falha na asserção' })
    }
  }

  // --- CASO 1: TEXTO PURO ---
  {
    const textoPuro = `Termo de Exemplo

1. Objeto
Este documento define as regras.
Segunda linha do tópico 1.

2. Vigência
O prazo de vigência é indeterminado.`

    const html = formatarConteudoTermoParaHtml(textoPuro)

    assert(
      'Caso 1 (Texto puro): Não deve ser identificado como HTML bruto',
      !contemMarcacaoHtml(textoPuro),
    )

    assert(
      'Caso 1 (Texto puro): Quebra dupla vira parágrafo <p>',
      html.includes('<p>Termo de Exemplo</p>') &&
        html.includes('<p>2. Vigência<br>O prazo de vigência é indeterminado.</p>'),
      `HTML obtido: ${html}`,
    )

    assert(
      'Caso 1 (Texto puro): Quebra simples vira <br>',
      html.includes('Este documento define as regras.<br>Segunda linha do tópico 1.'),
      `HTML obtido: ${html}`,
    )
  }

  // --- CASO 2: HTML PURO ---
  {
    const htmlPuro = `<p>Parágrafo inicial estruturado.</p>
<h2>1. Diretrizes</h2>
<p>Texto da diretriz.</p>
<ul>
  <li>Item A</li>
  <li>Item B</li>
</ul>`

    const html = formatarConteudoTermoParaHtml(htmlPuro)

    assert('Caso 2 (HTML puro): Detecta tags HTML', contemMarcacaoHtml(htmlPuro))

    assert(
      'Caso 2 (HTML puro): Preserva tags de bloco e listas intactas',
      html.includes('<h2>1. Diretrizes</h2>') &&
        html.includes('<ul>') &&
        html.includes('<li>Item A</li>') &&
        html.includes('<li>Item B</li>'),
      `HTML obtido: ${html}`,
    )
  }

  // --- CASO 3: CONTEÚDO MISTO (Amostra representativa do termo vigente) ---
  {
    // Amostra que replica a estrutura real do termo de uso de imagem:
    // Texto corrido sem <p> ou <br>, com tópicos numerados separados por \n\n ou \n,
    // e por volta do tópico 10 um bloco <ul><li>.
    const conteudoMistoRealista = `Vigente a partir de 21/09/2026

1. Objeto
Ao aceitar este Termo, autorizo o uso de imagem para reconhecimento profissional no ecossistema Credlar Vacation.

2. Finalidade
Divulgação institucional no Hall da Fama e materiais internos.

9. Propriedade Intelectual
Todos os direitos conexos permanecem salvaguardados.

10. Direitos do Titular
Nos termos da LGPD (Lei nº 13.709/2018), você poderá a qualquer momento:
<ul>
  <li>Confirmar a existência de tratamento de seus dados</li>
  <li>Acessar as fotos e informações publicadas</li>
  <li>Solicitar a revogação do consentimento</li>
</ul>

11. Revogação do Consentimento
A revogação poderá ser realizada diretamente pelo link exclusivo do convite.

12. Disposições Finais
Este termo entra em vigor na data de seu aceite.`

    const html = formatarConteudoTermoParaHtml(conteudoMistoRealista)

    assert(
      'Caso 3 (Conteúdo misto): Detecta presença de HTML pela lista',
      contemMarcacaoHtml(conteudoMistoRealista),
    )

    assert(
      'Caso 3 (Conteúdo misto): Quebras duplas fora da lista viram parágrafos <p>',
      html.includes('<p>Vigente a partir de 21/09/2026</p>') &&
        html.includes(
          '<p>2. Finalidade<br>Divulgação institucional no Hall da Fama e materiais internos.</p>',
        ),
      `HTML obtido: ${html}`,
    )

    assert(
      'Caso 3 (Conteúdo misto): Quebras simples no texto viram <br>',
      html.includes('1. Objeto<br>Ao aceitar este Termo') ||
        html.includes('2. Finalidade<br>Divulgação institucional'),
      `HTML obtido: ${html}`,
    )

    assert(
      'Caso 3 (Conteúdo misto): Bloco <ul><li> perto do tópico 10 é preservado com estrutura de lista',
      html.includes('<ul>') &&
        html.includes('<li>Confirmar a existência de tratamento de seus dados</li>') &&
        html.includes('<li>Solicitar a revogação do consentimento</li>') &&
        html.includes('</ul>'),
      `HTML obtido: ${html}`,
    )

    assert(
      'Caso 3 (Conteúdo misto): Tópicos subsequentes (ex: 11 e 12) viram parágrafos separados',
      html.includes(
        '<p>11. Revogação do Consentimento<br>A revogação poderá ser realizada diretamente pelo link exclusivo do convite.</p>',
      ) &&
        html.includes(
          '<p>12. Disposições Finais<br>Este termo entra em vigor na data de seu aceite.</p>',
        ),
      `HTML obtido: ${html}`,
    )
  }

  // --- CASO 4: SANITIZAÇÃO DE SEGURANÇA (XSS) ---
  {
    const xssMisto = `Texto com quebra dupla

<script>alert("hack")</script>
<p onclick="steal()">Clique aqui</p>
<a href="javascript:alert(1)">Link malicioso</a>
<img src="x" onerror="alert(2)" />
<ul>
  <li>Item seguro</li>
</ul>`

    const html = formatarConteudoTermoParaHtml(xssMisto)

    assert(
      'Sanitização: Tag <script> foi completamente removida',
      !html.toLowerCase().includes('<script') && !html.includes('alert("hack")'),
      `HTML obtido: ${html}`,
    )

    assert(
      'Sanitização: Atributos on* inline (onclick, onerror) foram removidos',
      !html.includes('onclick') && !html.includes('onerror') && !html.includes('steal()'),
      `HTML obtido: ${html}`,
    )

    assert(
      'Sanitização: Esquema javascript: em links foi neutralizado',
      !html.includes('javascript:alert'),
      `HTML obtido: ${html}`,
    )

    assert(
      'Sanitização: Lista legítima no mesmo conteúdo foi mantida',
      html.includes('<ul>') && html.includes('<li>Item seguro</li>'),
      `HTML obtido: ${html}`,
    )
  }

  const passou = detalhes.filter((d) => d.sucesso).length
  const falhou = detalhes.filter((d) => !d.sucesso).length

  return {
    total: detalhes.length,
    passou,
    falhou,
    detalhes,
  }
}
