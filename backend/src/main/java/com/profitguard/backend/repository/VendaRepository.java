package com.profitguard.backend.repository;

import com.profitguard.backend.model.Venda;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface VendaRepository extends JpaRepository<Venda, Long> {

    @EntityGraph(attributePaths = "itens")
    List<Venda> findAllByOrderByDataVendaDescIdDesc();

    @EntityGraph(attributePaths = "itens")
    List<Venda> findByDataVendaGreaterThanEqualOrderByDataVendaDescIdDesc(LocalDateTime desde);

    long countByDataVendaGreaterThanEqual(LocalDateTime desde);

    @Query("SELECT SUM(v.valorTotal) FROM Venda v WHERE v.dataVenda >= :desde")
    BigDecimal somarFaturamentoDesde(@Param("desde") LocalDateTime desde);
}
