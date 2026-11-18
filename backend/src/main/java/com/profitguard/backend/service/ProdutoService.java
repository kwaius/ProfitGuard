package com.profitguard.backend.service;

import com.profitguard.backend.exception.ResourceNotFoundException;
import com.profitguard.backend.model.Produto;
import com.profitguard.backend.repository.ProdutoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProdutoService {

    @Autowired
    private ProdutoRepository produtoRepository;

    public List<Produto> listarTodos() {
        return produtoRepository.findAllByOrderByNome();
    }

    public List<Produto> buscarPorNome(String busca) {
        if (busca == null || busca.isBlank()) {
            return listarTodos();
        }
        return produtoRepository.findByNomeContainingIgnoreCaseOrderByNome(busca.trim());
    }

    public Produto buscarPorId(Long id) {
        return produtoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado: id=" + id));
    }

    /** Busca já travando a linha (uso interno nas movimentações de estoque). */
    public Produto buscarPorIdParaAtualizacao(Long id) {
        return produtoRepository.findByIdParaAtualizacao(id)
                .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado: id=" + id));
    }

    public Produto criar(Produto produto) {
        if (produto.getInsumoImportado() == null) {
            produto.setInsumoImportado(false);
        }
        return produtoRepository.save(produto);
    }

    public Produto atualizar(Long id, Produto dadosAtualizados) {
        Produto produto = buscarPorId(id);
        produto.setNome(dadosAtualizados.getNome());
        produto.setQuantidadeDisponivel(dadosAtualizados.getQuantidadeDisponivel());
        produto.setEstoqueMinimo(dadosAtualizados.getEstoqueMinimo());
        produto.setCustoUnitario(dadosAtualizados.getCustoUnitario());
        produto.setPrecoVenda(dadosAtualizados.getPrecoVenda());
        produto.setInsumoImportado(Boolean.TRUE.equals(dadosAtualizados.getInsumoImportado()));
        return produtoRepository.save(produto);
    }

    public void deletar(Long id) {
        // se o produto já tem vendas/movimentações o banco recusa; o GlobalExceptionHandler devolve 409
        produtoRepository.delete(buscarPorId(id));
    }

    public List<Produto> listarComEstoqueBaixo() {
        return produtoRepository.findComEstoqueBaixo();
    }

}
