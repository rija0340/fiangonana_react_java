package com.example.demo.repository;

import com.example.demo.model.Planning;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlanningRepository extends JpaRepository<Planning, Long> {
    List<Planning> findByNumeroSemaine(Integer numeroSemaine);
    List<Planning> findByJourId(Long jourId);
    List<Planning> findByRoleId(Long roleId);
    List<Planning> findByMembreId(Long membreId);
    List<Planning> findByNumeroSemaineAndJourId(Integer numeroSemaine, Long jourId);
    List<Planning> findBySessionId(Long sessionId);
}