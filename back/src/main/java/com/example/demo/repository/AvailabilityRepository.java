package com.example.demo.repository;

import com.example.demo.model.Availability;
import com.example.demo.model.Membre;
import com.example.demo.model.PlanningSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AvailabilityRepository extends JpaRepository<Availability, Long> {
    List<Availability> findByPlanningSessionId(Long sessionId);
    List<Availability> findByMembreAndPlanningSession(Membre membre, PlanningSession planningSession);
    List<Availability> findByPlanningSessionAndDate(PlanningSession planningSession, LocalDate date);
    List<Availability> findByPlanningSessionIdAndMembreId(Long sessionId, Long membreId);
}