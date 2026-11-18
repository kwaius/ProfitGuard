package com.profitguard.backend.service;

import com.profitguard.backend.dto.DashboardResponse;
import com.profitguard.backend.model.Produto;
import com.profitguard.backend.model.TipoTransacao;
import com.profitguard.backend.repository.ItemVendaRepository;
import com.profitguard.backend.repository.VendaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class DashboardService {

    private static final int JANELA_DIAS = 30;
    private static final int TOP_PRODUTOS = 5;

    @Autowired
    private ProdutoService produtoService;

    @Autowired
    private FinanceiroService financeiroService;

    @Autowired
    private VendaRepository vendaRepository;

    @Autowired
    private ItemVendaRepository itemVendaRepository;

    public DashboardResponse gerar() {
        BigDecimal receitas = financeiroService.somarPorTipo(TipoTransacao.RECEITA);
        BigDecimal despesas = financeiroService.somarPorTipo(TipoTransacao.DESPESA);

        List<Produto> produtos = produtoService.listarTodos();
        BigDecimal valorCusto = BigDecimal.ZERO;
        BigDecimal valorVenda = BigDecimal.ZERO;
        for (Produto p : produtos) {
            BigDecimal qtd = BigDecimal.valueOf(p.getQuantidadeDisponivel());
            valorCusto = valorCusto.add(p.getCustoUnitario().multiply(qtd));
            valorVenda = valorVenda.add(p.getPrecoVenda().multiply(qtd));
        }

        LocalDateTime desde = LocalDateTime.now().minusDays(JANELA_DIAS);
        long vendas = vendaRepository.countByDataVendaGreaterThanEqual(desde);
        BigDecimal faturamento = vendaRepository.somarFaturamentoDesde(desde);
        if (faturamento == null) {
            faturamento = BigDecimal.ZERO;
        }
        BigDecimal ticketMedio = vendas == 0
                ? BigDecimal.ZERO
                : faturamento.divide(BigDecimal.valueOf(vendas), 2, RoundingMode.HALF_UP);

        List<DashboardResponse.ProdutoRanking> ranking = itemVendaRepository.rankingProdutos(desde).stream()
                .limit(TOP_PRODUTOS)
                .map(linha -> {
                    DashboardResponse.ProdutoRanking r = new DashboardResponse.ProdutoRanking();
                    r.setProdutoId(((Number) linha[0]).longValue());
                    r.setProdutoNome((String) linha[1]);
                    r.setQuantidadeVendida(((Number) linha[2]).longValue());
                    r.setFaturamento((BigDecimal) linha[3]);
                    return r;
                })
                .toList();

        DashboardResponse response = new DashboardResponse();
        response.setTotalReceitas(receitas);
        response.setTotalDespesas(despesas);
        response.setSaldoCaixa(receitas.subtract(despesas));
        response.setQuantidadeProdutos(produtos.size());
        response.setProdutosComEstoqueBaixo(produtoService.listarComEstoqueBaixo());
        response.setValorEstoqueCusto(valorCusto);
        response.setValorEstoqueVenda(valorVenda);
        response.setQuantidadeVendas30Dias((int) vendas);
        response.setFaturamento30Dias(faturamento);
        response.setTicketMedio30Dias(ticketMedio);
        response.setProdutosMaisVendidos(ranking);
        return response;
    }
}
