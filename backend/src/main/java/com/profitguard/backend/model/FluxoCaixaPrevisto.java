package com.profitguard.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Entrada ou saída prevista (conta a pagar / a receber) usada na projeção do fluxo de caixa. */
@Entity
@Table(name = "fluxo_caixa_previsto")
@Getter
@Setter
public class FluxoCaixaPrevisto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String descricao;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal valor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoTransacao tipo;

    @Column(nullable = false)
    private LocalDate dataVencimento;
}
