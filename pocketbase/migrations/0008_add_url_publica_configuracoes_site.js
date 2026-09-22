migrate(
  (app) => {
    const configCol = app.findCollectionByNameOrId('configuracoes_site')
    if (!configCol.fields.getByName('url_publica')) {
      configCol.fields.add(
        new URLField({
          name: 'url_publica',
        }),
      )
      app.save(configCol)
    }
  },
  (app) => {
    try {
      const configCol = app.findCollectionByNameOrId('configuracoes_site')
      configCol.fields.removeByName('url_publica')
      app.save(configCol)
    } catch (_) {}
  },
)
