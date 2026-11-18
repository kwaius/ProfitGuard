package com.profitguard.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/** Configuração única (id = 1): saldo informado pelo usuário e reserva mínima. */
@Entity
@Table(name = "configuracao_fluxo_caixa")
@Getter
@Setter
public class ConfiguracaoFluxoCaixa {

    public static final Long ID_UNICO = 1L;

    @Id
    private Long id = ID_UNICO;

    @Column(precision = 15, scale = 2)
    private BigDecimal saldoInicial;

    @Column(precision = 15, scale = 2)
    private BigDecimal reservaMinima = BigDecimal.ZERO;
}
