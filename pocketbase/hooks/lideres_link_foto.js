// Rota: GET /backend/v1/lideres/{id}/link-foto
// Acesso: somente usuarios_admin autenticados (admin e dho).
// Só responde quando o líder estiver com status "autorizado".
// Lê internamente o token_convite do líder e devolve:
// - link: link completo absoluto com url_publica de configuracoes_site (com fallback)
// - mensagem: mensagem pronta para WhatsApp baseada em mensagem_convite de configuracoes_site,
//   com {nome}, {link} e {validade} substituídos (validade em DD/MM/AAAA no fuso configurado).
// Se o líder não possuir token_convite registrado, devolve erro:
// "Este líder não possui link ativo. Gere um novo convite."

routerAdd(
  'GET',
  '/backend/v1/lideres/{id}/link-foto',
  (e) => {
    const auth = e.auth
    if (!auth) {
      return e.json(401, { message: 'Acesso não autorizado.' })
    }

    const collectionName = auth.collection ? auth.collection().name || '' : ''
    if (collectionName !== 'usuarios_admin') {
      return e.json(403, {
        message: 'Apenas administradores podem obter o link de atualização de foto.',
      })
    }

    const liderId = e.request.pathValue('id')
    if (!liderId) {
      return e.json(400, { message: 'ID do líder é obrigatório.' })
    }

    let lider
    try {
      lider = $app.findFirstRecordByData('lideres', 'id', liderId)
    } catch (_) {
      return e.json(404, { message: 'Líder não encontrado.' })
    }

    if (!lider) {
      return e.json(404, { message: 'Líder não encontrado.' })
    }

    // Só responde quando o líder estiver com status "autorizado"
    const status = lider.getString('status')
    if (status !== 'autorizado') {
      return e.json(400, {
        message:
          'O link de atualização de foto só está disponível para líderes com status "autorizado".',
      })
    }

    // Verificar token_convite
    const token = lider.getString('token_convite')
    if (!token || !token.trim()) {
      return e.json(400, {
        message: 'Este líder não possui link ativo. Gere um novo convite.',
      })
    }

    // Obter url_publica e mensagem_atualizar_foto de configuracoes_site
    let urlPublicaConfig = ''
    let mensagemAtualizarFotoTemplate =
      'Olá, {nome}! Para ajustar a sua foto no Hall da Fama, acesse: {link}. É só arrastar e dar zoom até o rosto ficar centralizado.'

    try {
      const configs = $app.findRecordsByFilter('configuracoes_site', '', '', 1, 0)
      if (configs && configs.length > 0) {
        const u = configs[0].getString('url_publica')
        if (u && u.trim()) {
          urlPublicaConfig = u.trim()
        }
        const m = configs[0].getString('mensagem_atualizar_foto')
        if (m && m.trim()) {
          mensagemAtualizarFotoTemplate = m
        }
      }
    } catch (cfgErr) {
      console.log('Erro ao buscar configuracoes_site em link-foto:', cfgErr)
    }

    // Determinar baseUrl
    let baseUrl = urlPublicaConfig.replace(/\/+$/, '')
    if (!baseUrl) {
      // Fallback via host da requisição se configurado
      try {
        const reqHost = e.request.header.get('x-forwarded-host') || e.request.header.get('host')
        const proto = e.request.header.get('x-forwarded-proto') || 'https'
        if (reqHost) {
          baseUrl = proto + '://' + reqHost
        }
      } catch (_) {}
    }

    if (!baseUrl) {
      return e.json(400, {
        message:
          'O endereço público do site não está configurado. Por favor, acesse o painel em Marca & Configurações e informe o campo "Endereço público do site".',
      })
    }

    baseUrl = baseUrl.replace(/\/+$/, '')
    const linkCompleto = baseUrl + '/cadastro/' + encodeURIComponent(token.trim())

    const nomeLider = lider.getString('nome_exibicao') || lider.getString('nome') || 'Líder'

    // Montar mensagem pronta para WhatsApp baseada em mensagem_atualizar_foto, sem citar validade
    const mensagemFinal = mensagemAtualizarFotoTemplate
      .split('{nome}')
      .join(nomeLider)
      .split('{link}')
      .join(linkCompleto)

    return e.json(200, {
      link: linkCompleto,
      mensagem: mensagemFinal,
      nome: nomeLider,
    })
  },
  $apis.requireAuth(),
)
