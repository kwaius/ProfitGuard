package com.profitguard.backend.repository;

import com.profitguard.backend.model.Produto;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProdutoRepository extends JpaRepository<Produto, Long> {

    @Query("SELECT p FROM Produto p WHERE p.quantidadeDisponivel <= p.estoqueMinimo ORDER BY p.nome")
    List<Produto> findComEstoqueBaixo();

    List<Produto> findByNomeContainingIgnoreCaseOrderByNome(String nome);

    List<Produto> findAllByOrderByNome();

    // trava a linha enquanto o estoque é alterado (evita duas vendas simultâneas estourarem o saldo)
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Produto p WHERE p.id = :id")
    Optional<Produto> findByIdParaAtualizacao(@Param("id") Long id);
}
