package com.profitguard.backend.dto;

import com.profitguard.backend.model.Contador;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;

/** { id, name, company, specialty, region, email, whatsapp, notes, createdAt } */
public record AccountantDTO(
        Long id,
        @NotBlank(message = "Informe o nome do contador ou escritório") String name,
        String company,
        String specialty,
        String region,
        String email,
        String whatsapp,
        String notes,
        LocalDateTime createdAt
) {

    public static AccountantDTO fromEntity(Contador c) {
        return new AccountantDTO(
                c.getId(), c.getNome(), c.getEscritorio(), c.getEspecialidade(), c.getRegiao(),
                c.getEmail(), c.getWhatsapp(), c.getObservacoes(), c.getCriadoEm());
    }
}
