package com.profitguard.backend.dto;

import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

/** { startingBalance (null = não informado), reserveAmount } */
public record CashFlowSettingsDTO(
        BigDecimal startingBalance,
        @PositiveOrZero(message = "A reserva mínima não pode ser negativa") BigDecimal reserveAmount
) {
}
