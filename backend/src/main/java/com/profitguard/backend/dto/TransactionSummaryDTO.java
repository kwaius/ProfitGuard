package com.profitguard.backend.dto;

import java.math.BigDecimal;

public record TransactionSummaryDTO(BigDecimal income, BigDecimal expense, BigDecimal balance, long count) {
}
