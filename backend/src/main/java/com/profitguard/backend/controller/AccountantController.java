package com.profitguard.backend.controller;

import com.profitguard.backend.dto.AccountantDTO;
import com.profitguard.backend.service.ContadorService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accountants")
public class AccountantController {

    @Autowired
    private ContadorService contadorService;

    @GetMapping
    public List<AccountantDTO> listar() {
        return contadorService.listar();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AccountantDTO criar(@Valid @RequestBody AccountantDTO dto) {
        return contadorService.criar(dto);
    }

    @PutMapping("/{id}")
    public AccountantDTO atualizar(@PathVariable Long id, @Valid @RequestBody AccountantDTO dto) {
        return contadorService.atualizar(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        contadorService.excluir(id);
    }
}
