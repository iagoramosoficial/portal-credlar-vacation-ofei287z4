migrate(
  (app) => {
    const lideres = app.findCollectionByNameOrId('lideres')

    // createRule e updateRule: acrescentar @request.body.foto:isset = false (a foto só entra pela rota do próprio líder).
    // deleteRule: somente usuarios_admin e somente se status = "pendente".
    lideres.createRule =
      '@request.auth.collectionName = "usuarios_admin" && @request.body.status:isset = false && @request.body.token_convite:isset = false && @request.body.convite_expira_em:isset = false && @request.body.termo_aceito:isset = false && @request.body.foto:isset = false'

    lideres.updateRule =
      '@request.auth.collectionName = "usuarios_admin" && @request.body.status:isset = false && @request.body.token_convite:isset = false && @request.body.convite_expira_em:isset = false && @request.body.termo_aceito:isset = false && @request.body.foto:isset = false'

    lideres.deleteRule = '@request.auth.collectionName = "usuarios_admin" && status = "pendente"'

    app.save(lideres)
  },
  (app) => {
    const lideres = app.findCollectionByNameOrId('lideres')

    lideres.createRule =
      '@request.auth.collectionName = "usuarios_admin" && @request.body.status:isset = false && @request.body.token_convite:isset = false && @request.body.convite_expira_em:isset = false && @request.body.termo_aceito:isset = false'

    lideres.updateRule =
      '@request.auth.collectionName = "usuarios_admin" && @request.body.status:isset = false && @request.body.token_convite:isset = false && @request.body.convite_expira_em:isset = false && @request.body.termo_aceito:isset = false'

    lideres.deleteRule = '@request.auth.collectionName = "usuarios_admin"'

    app.save(lideres)
  },
)
