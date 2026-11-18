function TransactionForm({ onAdd, onEdit, onClose, transaction }) {
  const isEditing = Boolean(transaction);

  const handleSubmit = (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);

    const transactionData = {
      description: formData.get('description'),
      category: formData.get('category'),
      date: formData.get('date'),
      value: Number(formData.get('value')),
      type: formData.get('type'),
    };

    if (isEditing) {
      onEdit({
        ...transaction,
        ...transactionData,
      });
    } else {
      onAdd({
        id: Date.now(),
        ...transactionData,
      });
    }
  };

  const getDateValue = () => {
    if (!transaction) {
      return '';
    }

    const [day, month, year] = transaction.date.split('/');

    return `${year}-${month}-${day}`;
  };

  return (
    <div className="transaction-form-overlay">
      <div className="transaction-form">
        <div className="transaction-form-header">
          <div>
            <h2>
              {isEditing ? 'Editar transação' : 'Nova transação'}
            </h2>
            <p>
              {isEditing
                ? 'Atualize os dados da movimentação'
                : 'Adicione uma nova movimentação financeira'}
            </p>
          </div>
          <button
            type="button"
            className="close-button"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="description">
              Descrição
            </label>
            <input
              id="description"
              name="description"
              type="text"
              placeholder="Ex: Venda #1025"
              defaultValue={transaction?.description || ''}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="category">
              Categoria
            </label>
            <select
              id="category"
              name="category"
              defaultValue={transaction?.category || ''}
              required
            >
              <option value="">
                Selecione uma categoria
              </option>
              <option value="Vendas">
                Vendas
              </option>
              <option value="Estoque">
                Estoque
              </option>
              <option value="Contas">
                Contas
              </option>
              <option value="Fornecedores">
                Fornecedores
              </option>
              <option value="Manutenção">
                Manutenção
              </option>
              <option value="Outros">
                Outros
              </option>
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="value">
                Valor
              </label>
              <input
                id="value"
                name="value"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                defaultValue={transaction?.value || ''}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="date">
                Data
              </label>
              <input
                id="date"
                name="date"
                type="date"
                defaultValue={getDateValue()}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="type">
              Tipo
            </label>
            <select
              id="type"
              name="type"
              defaultValue={transaction?.type || 'income'}
              required
            >
              <option value="income">
                Entrada
              </option>
              <option value="expense">
                Saída
              </option>
            </select>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="submit-button"
            >
              {isEditing
                ? 'Salvar alterações'
                : 'Adicionar transação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TransactionForm;
