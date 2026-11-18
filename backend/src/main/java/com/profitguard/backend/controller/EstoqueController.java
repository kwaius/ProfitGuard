package com.profitguard.backend.controller;

import com.profitguard.backend.dto.MovimentacaoEstoqueRequest;
import com.profitguard.backend.model.MovimentacaoEstoque;
import com.profitguard.backend.service.EstoqueService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/estoque")
public class EstoqueController {

    @Autowired
    private EstoqueService estoqueService;

    @PostMapping("/movimentacoes")
    public MovimentacaoEstoque registrar(@Valid @RequestBody MovimentacaoEstoqueRequest request) {
        return estoqueService.registrar(request);
    }

    /** Últimas 100 movimentações de todos os produtos. */
    @GetMapping("/movimentacoes")
    public List<MovimentacaoEstoque> ultimas() {
        return estoqueService.ultimasMovimentacoes();
    }

    @GetMapping("/movimentacoes/produto/{produtoId}")
    public List<MovimentacaoEstoque> historico(@PathVariable Long produtoId) {
        return estoqueService.historicoPorProduto(produtoId);
    }
}
