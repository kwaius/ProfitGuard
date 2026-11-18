package com.profitguard.backend.dto;

import com.profitguard.backend.model.Produto;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
public class DashboardResponse {
    // financeiro (histórico completo)
    private BigDecimal totalReceitas;
    private BigDecimal totalDespesas;
    private BigDecimal saldoCaixa;

    // estoque
    private int quantidadeProdutos;
    private List<Produto> produtosComEstoqueBaixo;
    private BigDecimal valorEstoqueCusto;
    private BigDecimal valorEstoqueVenda;

    // vendas (últimos 30 dias)
    private int quantidadeVendas30Dias;
    private BigDecimal faturamento30Dias;
    private BigDecimal ticketMedio30Dias;
    private List<ProdutoRanking> produtosMaisVendidos;

    @Getter
    @Setter
    public static class ProdutoRanking {
        private Long produtoId;
        private String produtoNome;
        private Long quantidadeVendida;
        private BigDecimal faturamento;
    }
}
