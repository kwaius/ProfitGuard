package com.profitguard.backend.controller;

import com.profitguard.backend.model.Produto;
import com.profitguard.backend.service.ProdutoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/produtos")
public class ProdutoController {

    @Autowired
    private ProdutoService produtoService;

    /** ?busca=cimento filtra pelo nome (sem diferenciar maiúsculas). */
    @GetMapping
    public List<Produto> listar(@RequestParam(required = false) String busca) {
        return produtoService.buscarPorNome(busca);
    }

    @GetMapping("/estoque-baixo")
    public List<Produto> estoqueBaixo() {
        return produtoService.listarComEstoqueBaixo();
    }

    @GetMapping("/{id}")
    public Produto buscarPorId(@PathVariable Long id) {
        return produtoService.buscarPorId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Produto criar(@Valid @RequestBody Produto produto) {
        produto.setId(null); // POST nunca sobrescreve um produto existente
        return produtoService.criar(produto);
    }

    @PutMapping("/{id}")
    public Produto atualizar(@PathVariable Long id, @Valid @RequestBody Produto produto) {
        return produtoService.atualizar(id, produto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletar(@PathVariable Long id) {
        produtoService.deletar(id);
    }
}
