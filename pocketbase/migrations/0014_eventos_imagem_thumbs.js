migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('eventos')
    const imagemField = col.fields.getByName('imagem')
    if (imagemField) {
      imagemField.thumbs = ['200x200', '400x400']
      app.save(col)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('eventos')
      const imagemField = col.fields.getByName('imagem')
      if (imagemField) {
        imagemField.thumbs = []
        app.save(col)
      }
    } catch (_) {}
  },
)
