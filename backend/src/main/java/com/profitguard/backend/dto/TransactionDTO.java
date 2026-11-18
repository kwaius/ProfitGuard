package com.profitguard.backend.dto;

import com.profitguard.backend.model.TipoTransacao;
import com.profitguard.backend.model.TransacaoFinanceira;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Transação no mesmo formato usado pelo front-end:
 * { id, description, category, date (yyyy-MM-dd), value, type ("income" | "expense") }.
 */
public record TransactionDTO(
        Long id,
        @NotBlank(message = "A descrição é obrigatória") String description,
        String category,
        @NotNull(message = "A data é obrigatória") LocalDate date,
        @NotNull(message = "O valor é obrigatório")
        @Positive(message = "O valor deve ser maior que zero") BigDecimal value,
        @NotNull(message = "O tipo é obrigatório")
        @Pattern(regexp = "income|expense", message = "O tipo deve ser 'income' ou 'expense'") String type
) {

    public static TransactionDTO fromEntity(TransacaoFinanceira t) {
        return new TransactionDTO(
                t.getId(),
                t.getDescricao(),
                t.getCategoria(),
                t.getDataTransacao() != null ? t.getDataTransacao().toLocalDate() : null,
                t.getValor(),
                tipoParaFront(t.getTipo()));
    }

    public static String tipoParaFront(TipoTransacao tipo) {
        return tipo == TipoTransacao.RECEITA ? "income" : "expense";
    }

    public static TipoTransacao tipoDoFront(String type) {
        return "income".equals(type) ? TipoTransacao.RECEITA : TipoTransacao.DESPESA;
    }
}
