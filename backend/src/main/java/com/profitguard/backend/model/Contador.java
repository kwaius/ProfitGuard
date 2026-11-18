package com.profitguard.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "contador")
@Getter
@Setter
public class Contador {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    private String escritorio;

    private String especialidade;

    private String regiao;

    private String email;

    private String whatsapp;

    @Column(length = 2000)
    private String observacoes;

    private LocalDateTime criadoEm;

    @PrePersist
    public void aoCriar() {
        if (this.criadoEm == null) {
            this.criadoEm = LocalDateTime.now();
        }
    }
}
