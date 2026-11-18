package com.profitguard.backend.controller;

import com.profitguard.backend.dto.TransactionDTO;
import com.profitguard.backend.dto.TransactionSummaryDTO;
import com.profitguard.backend.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Transações no formato do front-end (description, category, date, value, type). */
@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    @Autowired
    private TransactionService transactionService;

    /** ?days=30 filtra os últimos 30 dias; sem o parâmetro devolve tudo (período "all" do front). */
    @GetMapping
    public List<TransactionDTO> listar(@RequestParam(required = false) Integer days) {
        return transactionService.listar(days);
    }

    @GetMapping("/summary")
    public TransactionSummaryDTO resumo(@RequestParam(required = false) Integer days) {
        return transactionService.resumo(days);
    }

    @GetMapping("/{id}")
    public TransactionDTO buscar(@PathVariable Long id) {
        return transactionService.buscar(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TransactionDTO criar(@Valid @RequestBody TransactionDTO dto) {
        return transactionService.criar(dto);
    }

    @PutMapping("/{id}")
    public TransactionDTO atualizar(@PathVariable Long id, @Valid @RequestBody TransactionDTO dto) {
        return transactionService.atualizar(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletar(@PathVariable Long id) {
        transactionService.deletar(id);
    }

    /** Botão "restaurar dados de exemplo" das Configurações. */
    @PostMapping("/reset")
    public List<TransactionDTO> restaurarExemplo() {
        return transactionService.restaurarExemplo();
    }
}
