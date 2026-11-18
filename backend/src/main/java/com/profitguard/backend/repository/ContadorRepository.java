package com.profitguard.backend.repository;

import com.profitguard.backend.model.Contador;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ContadorRepository extends JpaRepository<Contador, Long> {

    List<Contador> findAllByOrderByCriadoEmDescIdDesc();
}
