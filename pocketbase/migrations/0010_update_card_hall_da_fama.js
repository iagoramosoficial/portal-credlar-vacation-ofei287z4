migrate((app) => {
  try {
    const cards = app.findRecordsByFilter(
      'cards_home',
      "icone = 'Trophy' || titulo ~ 'Hall'",
      '',
      10,
      0,
    )
    for (const card of cards) {
      // Como o campo 'link' é do tipo 'url' ou text, podemos usar a raw query para atualizar o link interno /hall-da-fama
      app
        .db()
        .newQuery(
          "UPDATE cards_home SET link = '/hall-da-fama', clicavel = 1, selo_texto = '', selo_estilo = '', texto_botao = 'Ver Homenagens' WHERE id = {:id}",
        )
        .bind({ id: card.id })
        .execute()
    }
  } catch (err) {
    console.log('Erro ao atualizar card Hall da Fama:', err)
  }
})
