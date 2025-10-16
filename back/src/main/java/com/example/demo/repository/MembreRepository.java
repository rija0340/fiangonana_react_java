package com.example.demo.repository;

import com.example.demo.model.Membre;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MembreRepository extends JpaRepository<Membre, Long> {
    
    List<Membre> findByFamilleId(Long familleId);
}