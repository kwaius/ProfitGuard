package com.profitguard.backend.repository;

import com.profitguard.backend.model.TipoTransacao;
import com.profitguard.backend.model.TransacaoFinanceira;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface TransacaoFinanceiraRepository extends JpaRepository<TransacaoFinanceira, Long> {

    List<TransacaoFinanceira> findByTipo(TipoTransacao tipo);

    List<TransacaoFinanceira> findAllByOrderByDataTransacaoDescIdDesc();

    List<TransacaoFinanceira> findByDataTransacaoGreaterThanEqualOrderByDataTransacaoDescIdDesc(LocalDateTime desde);

    // retornam null quando não há linhas; o service converte para ZERO
    @Query("SELECT SUM(t.valor) FROM TransacaoFinanceira t WHERE t.tipo = :tipo")
    BigDecimal somarPorTipo(@Param("tipo") TipoTransacao tipo);

    @Query("SELECT SUM(t.valor) FROM TransacaoFinanceira t WHERE t.tipo = :tipo AND t.dataTransacao >= :desde")
    BigDecimal somarPorTipoDesde(@Param("tipo") TipoTransacao tipo, @Param("desde") LocalDateTime desde);
}
