package com.profitguard.backend.service;

import com.profitguard.backend.dto.TransactionDTO;
import com.profitguard.backend.dto.TransactionSummaryDTO;
import com.profitguard.backend.model.TipoTransacao;
import com.profitguard.backend.model.TransacaoFinanceira;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

/** Camada que fala o "idioma" do front-end (description/category/date/value/type). */
@Service
public class TransactionService {

    @Autowired
    private FinanceiroService financeiroService;

    public List<TransactionDTO> listar(Integer days) {
        return financeiroService.listarUltimosDias(days).stream().map(TransactionDTO::fromEntity).toList();
    }

    public TransactionDTO buscar(Long id) {
        return TransactionDTO.fromEntity(financeiroService.buscarPorId(id));
    }

    public TransactionDTO criar(TransactionDTO dto) {
        TransacaoFinanceira t = new TransacaoFinanceira();
        preencher(t, dto);
        return TransactionDTO.fromEntity(financeiroService.salvar(t));
    }

    public TransactionDTO atualizar(Long id, TransactionDTO dto) {
        TransacaoFinanceira t = financeiroService.buscarPorId(id);
        preencher(t, dto);
        return TransactionDTO.fromEntity(financeiroService.salvar(t));
    }

    public void deletar(Long id) {
        financeiroService.deletar(id);
    }

    public TransactionSummaryDTO resumo(Integer days) {
        BigDecimal receitas = financeiroService.somarPorTipoUltimosDias(TipoTransacao.RECEITA, days);
        BigDecimal despesas = financeiroService.somarPorTipoUltimosDias(TipoTransacao.DESPESA, days);
        long quantidade = financeiroService.listarUltimosDias(days).size();
        return new TransactionSummaryDTO(receitas, despesas, receitas.subtract(despesas), quantidade);
    }

    public List<TransactionDTO> restaurarExemplo() {
        return financeiroService.restaurarExemplo().stream().map(TransactionDTO::fromEntity).toList();
    }

    private void preencher(TransacaoFinanceira t, TransactionDTO dto) {
        t.setDescricao(dto.description().trim());
        t.setCategoria(dto.category() == null || dto.category().isBlank() ? "Outros" : dto.category().trim());
        t.setDataTransacao(dto.date().atStartOfDay());
        t.setValor(dto.value());
        t.setTipo(TransactionDTO.tipoDoFront(dto.type()));
    }
}
