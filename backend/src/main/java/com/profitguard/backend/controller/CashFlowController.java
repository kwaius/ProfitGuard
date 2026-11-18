package com.profitguard.backend.controller;

import com.profitguard.backend.dto.CashFlowSettingsDTO;
import com.profitguard.backend.dto.ScheduledCashFlowDTO;
import com.profitguard.backend.dto.TransactionDTO;
import com.profitguard.backend.service.CashFlowService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cashflow")
public class CashFlowController {

    @Autowired
    private CashFlowService cashFlowService;

    @GetMapping("/settings")
    public CashFlowSettingsDTO obterConfiguracao() {
        return cashFlowService.obterConfiguracao();
    }

    @PutMapping("/settings")
    public CashFlowSettingsDTO salvarConfiguracao(@Valid @RequestBody CashFlowSettingsDTO dto) {
        return cashFlowService.salvarConfiguracao(dto);
    }

    @GetMapping("/scheduled")
    public List<ScheduledCashFlowDTO> listar() {
        return cashFlowService.listarPrevistos();
    }

    @PostMapping("/scheduled")
    @ResponseStatus(HttpStatus.CREATED)
    public ScheduledCashFlowDTO criar(@Valid @RequestBody ScheduledCashFlowDTO dto) {
        return cashFlowService.criarPrevisto(dto);
    }

    @PutMapping("/scheduled/{id}")
    public ScheduledCashFlowDTO atualizar(@PathVariable Long id, @Valid @RequestBody ScheduledCashFlowDTO dto) {
        return cashFlowService.atualizarPrevisto(id, dto);
    }

    @DeleteMapping("/scheduled/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        cashFlowService.excluirPrevisto(id);
    }

    /** Dá baixa no previsto: cria a transação realizada e remove o lançamento previsto. */
    @PostMapping("/scheduled/{id}/realize")
    public TransactionDTO realizar(@PathVariable Long id) {
        return cashFlowService.realizarPrevisto(id);
    }
}
