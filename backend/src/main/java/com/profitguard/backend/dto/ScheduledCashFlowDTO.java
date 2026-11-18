package com.profitguard.backend.dto;

import com.profitguard.backend.model.FluxoCaixaPrevisto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;

/** { id, description, amount, type ("income" | "expense"), dueDate (yyyy-MM-dd) } */
public record ScheduledCashFlowDTO(
        Long id,
        @NotBlank(message = "A descrição é obrigatória") String description,
        @NotNull(message = "O valor é obrigatório")
        @Positive(message = "O valor deve ser maior que zero") BigDecimal amount,
        @NotNull(message = "O tipo é obrigatório")
        @Pattern(regexp = "income|expense", message = "O tipo deve ser 'income' ou 'expense'") String type,
        @NotNull(message = "O vencimento é obrigatório") LocalDate dueDate
) {

    public static ScheduledCashFlowDTO fromEntity(FluxoCaixaPrevisto e) {
        return new ScheduledCashFlowDTO(
                e.getId(),
                e.getDescricao(),
                e.getValor(),
                TransactionDTO.tipoParaFront(e.getTipo()),
                e.getDataVencimento());
    }
}
