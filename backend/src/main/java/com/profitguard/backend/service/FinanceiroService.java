package com.profitguard.backend.service;

import com.profitguard.backend.dto.TransacaoFinanceiraRequest;
import com.profitguard.backend.exception.ResourceNotFoundException;
import com.profitguard.backend.model.TipoTransacao;
import com.profitguard.backend.model.TransacaoFinanceira;
import com.profitguard.backend.repository.TransacaoFinanceiraRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class FinanceiroService {

    @Autowired
    private TransacaoFinanceiraRepository transacaoRepository;

    public List<TransacaoFinanceira> listarTodas() {
        return transacaoRepository.findAllByOrderByDataTransacaoDescIdDesc();
    }

    /** dias nulo ou <= 0 significa "todo o período". */
    public List<TransacaoFinanceira> listarUltimosDias(Integer dias) {
        if (dias == null || dias <= 0) {
            return listarTodas();
        }
        return transacaoRepository.findByDataTransacaoGreaterThanEqualOrderByDataTransacaoDescIdDesc(inicioDoPeriodo(dias));
    }

    public TransacaoFinanceira buscarPorId(Long id) {
        return transacaoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transação não encontrada: id=" + id));
    }

    public TransacaoFinanceira salvar(TransacaoFinanceira transacao) {
        return transacaoRepository.save(transacao);
    }

    public TransacaoFinanceira registrar(TransacaoFinanceiraRequest request) {
        TransacaoFinanceira transacao = new TransacaoFinanceira();
        transacao.setTipo(request.getTipo());
        transacao.setCategoria(request.getCategoria());
        transacao.setDescricao(request.getDescricao());
        transacao.setValor(request.getValor());
        transacao.setDataTransacao(request.getDataTransacao());
        return transacaoRepository.save(transacao);
    }

    public void deletar(Long id) {
        transacaoRepository.delete(buscarPorId(id));
    }

    public BigDecimal somarPorTipo(TipoTransacao tipo) {
        BigDecimal soma = transacaoRepository.somarPorTipo(tipo);
        return soma != null ? soma : BigDecimal.ZERO;
    }

    public BigDecimal somarPorTipoUltimosDias(TipoTransacao tipo, Integer dias) {
        if (dias == null || dias <= 0) {
            return somarPorTipo(tipo);
        }
        BigDecimal soma = transacaoRepository.somarPorTipoDesde(tipo, inicioDoPeriodo(dias));
        return soma != null ? soma : BigDecimal.ZERO;
    }

    public BigDecimal calcularSaldo() {
        return somarPorTipo(TipoTransacao.RECEITA).subtract(somarPorTipo(TipoTransacao.DESPESA));
    }

    public TransacaoFinanceira registrarReceitaDeVenda(BigDecimal valor, Long vendaId) {
        TransacaoFinanceira transacao = new TransacaoFinanceira();
        transacao.setTipo(TipoTransacao.RECEITA);
        transacao.setCategoria("Vendas");
        transacao.setDescricao("Venda #" + vendaId);
        transacao.setValor(valor);
        return transacaoRepository.save(transacao);
    }

    public TransacaoFinanceira registrarDespesaDeEstoque(BigDecimal valor, String descricao) {
        TransacaoFinanceira transacao = new TransacaoFinanceira();
        transacao.setTipo(TipoTransacao.DESPESA);
        transacao.setCategoria("Estoque");
        transacao.setDescricao(descricao);
        transacao.setValor(valor);
        return transacaoRepository.save(transacao);
    }

    /** Apaga todas as transações e recarrega o conjunto de exemplo do front (botão "restaurar dados"). */
    @Transactional
    public List<TransacaoFinanceira> restaurarExemplo() {
        transacaoRepository.deleteAll();
        transacaoRepository.flush();

        exemplo("Venda #1024", "Vendas", "2026-08-17", "1245", TipoTransacao.RECEITA);
        exemplo("Compra de estoque", "Estoque", "2026-08-16", "680", TipoTransacao.DESPESA);
        exemplo("Venda #1023", "Vendas", "2026-08-15", "890", TipoTransacao.RECEITA);
        exemplo("Conta de energia", "Contas", "2026-08-14", "320", TipoTransacao.DESPESA);
        exemplo("Venda #1022", "Vendas", "2026-08-13", "1480", TipoTransacao.RECEITA);
        exemplo("Pagamento fornecedor", "Fornecedores", "2026-08-10", "920", TipoTransacao.DESPESA);
        exemplo("Venda #1021", "Vendas", "2026-08-08", "2150", TipoTransacao.RECEITA);
        exemplo("Venda #1020", "Vendas", "2026-08-05", "1780", TipoTransacao.RECEITA);
        exemplo("Internet da empresa", "Contas", "2026-08-03", "180", TipoTransacao.DESPESA);
        exemplo("Venda #1019", "Vendas", "2026-07-28", "3250", TipoTransacao.RECEITA);
        exemplo("Compra de mercadorias", "Estoque", "2026-07-25", "1450", TipoTransacao.DESPESA);
        exemplo("Venda #1018", "Vendas", "2026-07-21", "2680", TipoTransacao.RECEITA);
        exemplo("Conta de energia", "Contas", "2026-07-18", "410", TipoTransacao.DESPESA);
        exemplo("Venda #1017", "Vendas", "2026-07-15", "1980", TipoTransacao.RECEITA);
        exemplo("Venda #1016", "Vendas", "2026-06-28", "3120", TipoTransacao.RECEITA);
        exemplo("Pagamento fornecedor", "Fornecedores", "2026-06-25", "1100", TipoTransacao.DESPESA);
        exemplo("Venda #1015", "Vendas", "2026-06-20", "2450", TipoTransacao.RECEITA);
        exemplo("Manutenção de equipamentos", "Manutenção", "2026-06-15", "750", TipoTransacao.DESPESA);
        exemplo("Venda #1014", "Vendas", "2026-06-10", "2890", TipoTransacao.RECEITA);
        exemplo("Conta de internet", "Contas", "2026-06-05", "180", TipoTransacao.DESPESA);

        return listarTodas();
    }

    private void exemplo(String descricao, String categoria, String data, String valor, TipoTransacao tipo) {
        TransacaoFinanceira t = new TransacaoFinanceira();
        t.setDescricao(descricao);
        t.setCategoria(categoria);
        t.setDataTransacao(LocalDate.parse(data).atStartOfDay());
        t.setValor(new BigDecimal(valor));
        t.setTipo(tipo);
        transacaoRepository.save(t);
    }

    private LocalDateTime inicioDoPeriodo(int dias) {
        return LocalDate.now().minusDays(dias).atStartOfDay();
    }
}
