// Hook para garantir que todo líder criado nasça com status "pendente"
// Executa no model hook onRecordCreate da coleção lideres antes de salvar no banco.
onRecordCreate((e) => {
  e.record.set('status', 'pendente')
  e.next()
}, 'lideres')
