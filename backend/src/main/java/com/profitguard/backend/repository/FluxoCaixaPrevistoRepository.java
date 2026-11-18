package com.profitguard.backend.repository;

import com.profitguard.backend.model.FluxoCaixaPrevisto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FluxoCaixaPrevistoRepository extends JpaRepository<FluxoCaixaPrevisto, Long> {

    List<FluxoCaixaPrevisto> findAllByOrderByDataVencimentoAscIdAsc();
}
