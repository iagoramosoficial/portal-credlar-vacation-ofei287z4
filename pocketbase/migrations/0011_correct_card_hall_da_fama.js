migrate((app) => {
  try {
    app
      .db()
      .newQuery(
        "UPDATE cards_home SET link = '/hall-da-fama', clicavel = 1, selo_texto = '', selo_estilo = '', texto_botao = 'Ver Homenagens' WHERE icone = 'Trophy' OR titulo LIKE '%Hall%'",
      )
      .execute()
  } catch (err) {
    console.log('Erro ao atualizar card Hall da Fama no 0011:', err)
  }
})
