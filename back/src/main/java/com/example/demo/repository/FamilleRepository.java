package com.example.demo.repository;

import com.example.demo.model.Famille;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FamilleRepository extends JpaRepository<Famille, Long> {
    
    @Query("SELECT f FROM Famille f LEFT JOIN FETCH f.membres WHERE f.id = :id")
    Optional<Famille> findByIdWithMembres(@Param("id") Long id);
}