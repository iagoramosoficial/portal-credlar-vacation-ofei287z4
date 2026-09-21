migrate(
  (app) => {
    // 1. Coleção padrão users
    // Desativar cadastro público (createRule: null)
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.createRule = null
    app.save(users)

    // 2. Coleção usuarios_admin
    // listRule e viewRule: somente usuários autenticados da própria coleção usuarios_admin
    // updateRule: usuário só edita próprio registro e nunca o campo papel
    // createRule e deleteRule continuam null (somente superusuário)
    const usuariosAdmin = app.findCollectionByNameOrId('usuarios_admin')
    usuariosAdmin.listRule = '@request.auth.collectionName = "usuarios_admin"'
    usuariosAdmin.viewRule = '@request.auth.collectionName = "usuarios_admin"'
    usuariosAdmin.updateRule =
      '@request.auth.collectionName = "usuarios_admin" && id = @request.auth.id && @request.body.papel:isset = false'
    usuariosAdmin.createRule = null
    usuariosAdmin.deleteRule = null
    app.save(usuariosAdmin)
  },
  (app) => {
    // Reverter regras de users e usuarios_admin para o estado da migration 0003
    try {
      const users = app.findCollectionByNameOrId('_pb_users_auth_')
      users.createRule = ''
      app.save(users)
    } catch (_) {}

    try {
      const usuariosAdmin = app.findCollectionByNameOrId('usuarios_admin')
      usuariosAdmin.listRule = '@request.auth.id != ""'
      usuariosAdmin.viewRule = '@request.auth.id != ""'
      usuariosAdmin.updateRule = '@request.auth.id != "" && id = @request.auth.id'
      usuariosAdmin.createRule = null
      usuariosAdmin.deleteRule = null
      app.save(usuariosAdmin)
    } catch (_) {}
  },
)
