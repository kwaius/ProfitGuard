package com.profitguard.backend.service;

import com.profitguard.backend.dto.MovimentacaoEstoqueRequest;
import com.profitguard.backend.exception.EstoqueInsuficienteException;
import com.profitguard.backend.model.MovimentacaoEstoque;
import com.profitguard.backend.model.Produto;
import com.profitguard.backend.model.TipoMovimentacao;
import com.profitguard.backend.repository.MovimentacaoEstoqueRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class EstoqueService {

    @Autowired
    private MovimentacaoEstoqueRepository movimentacaoRepository;

    @Autowired
    private ProdutoService produtoService;

    @Autowired
    private FinanceiroService financeiroService;

    /** Entrada pela API: opcionalmente já lança a compra como despesa "Estoque". */
    @Transactional
    public MovimentacaoEstoque registrar(MovimentacaoEstoqueRequest request) {
        MovimentacaoEstoque movimentacao = registrarMovimentacao(
                request.getProdutoId(), request.getTipo(), request.getQuantidade(), request.getMotivo());

        if (request.getTipo() == TipoMovimentacao.ENTRADA && Boolean.TRUE.equals(request.getGerarDespesa())) {
            Produto produto = movimentacao.getProduto();
            BigDecimal total = produto.getCustoUnitario().multiply(BigDecimal.valueOf(request.getQuantidade()));
            if (total.signum() > 0) {
                financeiroService.registrarDespesaDeEstoque(total,
                        "Compra de estoque: " + produto.getNome() + " x" + request.getQuantidade());
            }
        }
        return movimentacao;
    }

    @Transactional
    public MovimentacaoEstoque registrarMovimentacao(Long produtoId, TipoMovimentacao tipo, Integer quantidade, String motivo) {
        Produto produto = produtoService.buscarPorIdParaAtualizacao(produtoId);

        aplicarNoEstoque(produto, tipo, quantidade);

        MovimentacaoEstoque movimentacao = new MovimentacaoEstoque();
        movimentacao.setProduto(produto);
        movimentacao.setTipo(tipo);
        movimentacao.setQuantidade(quantidade);
        movimentacao.setMotivo(motivo);

        return movimentacaoRepository.save(movimentacao);
    }

    public void aplicarNoEstoque(Produto produto, TipoMovimentacao tipo, Integer quantidade) {
        if (tipo == TipoMovimentacao.SAIDA && produto.getQuantidadeDisponivel() < quantidade) {
            throw new EstoqueInsuficienteException(
                    "Estoque insuficiente para o produto '" + produto.getNome() + "'. "
                            + "Disponível: " + produto.getQuantidadeDisponivel() + ", solicitado: " + quantidade);
        }

        int novaQuantidade = tipo == TipoMovimentacao.ENTRADA
                ? produto.getQuantidadeDisponivel() + quantidade
                : produto.getQuantidadeDisponivel() - quantidade;

        produto.setQuantidadeDisponivel(novaQuantidade);
        produtoService.criar(produto); // como o produto já tem id, o save() atualiza em vez de inserir
    }

    public List<MovimentacaoEstoque> historicoPorProduto(Long produtoId) {
        return movimentacaoRepository.findByProdutoIdOrderByDataMovimentacaoDesc(produtoId);
    }

    public List<MovimentacaoEstoque> ultimasMovimentacoes() {
        return movimentacaoRepository.findTop100ByOrderByDataMovimentacaoDescIdDesc();
    }
}
