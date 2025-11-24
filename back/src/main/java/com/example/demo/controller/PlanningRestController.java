package com.example.demo.controller;

import com.example.demo.model.*;
import com.example.demo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/planning")
@CrossOrigin(origins = "http://localhost:5173") // Vite default port
public class PlanningRestController {

    @Autowired
    private PlanningRepository planningRepository;

    @Autowired
    private PlanningSessionRepository planningSessionRepository;

    @Autowired
    private AvailabilityRepository availabilityRepository;

    @Autowired
    private PlanningSessionService planningSessionService;

    // Planning Session endpoints
    @GetMapping("/sessions")
    public List<PlanningSessionDTO> getAllPlanningSessions() {
        List<PlanningSession> sessions = planningSessionRepository.findAll();
        return sessions.stream()
                .map(planningSessionService::toDto)
                .collect(Collectors.toList());
    }

    @GetMapping("/sessions/{id}")
    public ResponseEntity<PlanningSessionDTO> getPlanningSessionById(@PathVariable Long id) {
        Optional<PlanningSession> session = planningSessionRepository.findById(id);
        return session.map(s -> ResponseEntity.ok(planningSessionService.toDto(s)))
                    .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/sessions")
    public PlanningSessionDTO createPlanningSession(@RequestBody PlanningSessionDTO sessionDto) {
        PlanningSession session = planningSessionService.fromDto(sessionDto);
        PlanningSession savedSession = planningSessionRepository.save(session);
        return planningSessionService.toDto(savedSession);
    }

    @PutMapping("/sessions/{id}")
    public ResponseEntity<PlanningSessionDTO> updatePlanningSession(@PathVariable Long id,
            @RequestBody PlanningSessionDTO sessionDetails) {
        Optional<PlanningSession> optionalSession = planningSessionRepository.findById(id);
        if (optionalSession.isPresent()) {
            PlanningSession session = optionalSession.get();
            session.setNom(sessionDetails.getNom());
            session.setDescription(sessionDetails.getDescription());
            session.setSelectedDates(sessionDetails.getSelectedDates());
            session.setCustomRoles(sessionDetails.getCustomRoles());

            // Convertir les personCodes en objets Membre
            if (sessionDetails.getSelectedPeople() != null && !sessionDetails.getSelectedPeople().isEmpty()) {
                List<Membre> membres = membreRepository.findByPersonCodeIn(sessionDetails.getSelectedPeople());
                session.setSelectedPeople(membres);
            } else {
                session.setSelectedPeople(new ArrayList<>()); // Liste vide
            }

            PlanningSession updatedSession = planningSessionRepository.save(session);
            return ResponseEntity.ok(planningSessionService.toDto(updatedSession));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/sessions/{id}")
    public ResponseEntity<Void> deletePlanningSession(@PathVariable Long id) {
        if (planningSessionRepository.existsById(id)) {
            // Also delete associated plannings and availabilities
            // This will work with cascade delete configured in the entities
            planningSessionRepository.deleteById(id);
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // Availability endpoints
    @GetMapping("/sessions/{sessionId}/availability")
    public List<Availability> getAvailabilityForSession(@PathVariable Long sessionId) {
        return availabilityRepository.findByPlanningSessionId(sessionId);
    }

    @GetMapping("/sessions/{sessionId}/availability/membre/{membreId}")
    public List<Availability> getAvailabilityForSessionAndMembre(@PathVariable Long sessionId,
            @PathVariable Long membreId) {
        return availabilityRepository.findByPlanningSessionIdAndMembreId(sessionId, membreId);
    }

    @PostMapping("/sessions/{sessionId}/availability")
    public Availability createAvailability(@PathVariable Long sessionId, @RequestBody Availability availability) {
        // Verify session exists
        Optional<PlanningSession> session = planningSessionRepository.findById(sessionId);
        if (!session.isPresent()) {
            throw new RuntimeException("Planning session not found");
        }

        // Set the session reference
        availability.setPlanningSession(session.get());

        return availabilityRepository.save(availability);
    }

    @PutMapping("/sessions/{sessionId}/availability/{id}")
    public ResponseEntity<Availability> updateAvailability(@PathVariable Long sessionId, @PathVariable Long id,
            @RequestBody Availability availabilityDetails) {
        Optional<Availability> optionalAvailability = availabilityRepository.findById(id);
        if (optionalAvailability.isPresent() &&
                optionalAvailability.get().getPlanningSession().getId().equals(sessionId)) {
            Availability availability = optionalAvailability.get();
            availability.setMembre(availabilityDetails.getMembre());
            availability.setDate(availabilityDetails.getDate());
            availability.setDisponible(availabilityDetails.isDisponible());
            return ResponseEntity.ok(availabilityRepository.save(availability));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/sessions/{sessionId}/availability/{id}")
    public ResponseEntity<Void> deleteAvailability(@PathVariable Long sessionId, @PathVariable Long id) {
        Optional<Availability> availability = availabilityRepository.findById(id);
        if (availability.isPresent() &&
                availability.get().getPlanningSession().getId().equals(sessionId)) {
            availabilityRepository.deleteById(id);
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // Planning endpoints
    @GetMapping
    public List<Planning> getAllPlanning() {
        return planningRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Planning> getPlanningById(@PathVariable Long id) {
        Optional<Planning> planning = planningRepository.findById(id);
        return planning.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/session/{sessionId}")
    public List<Planning> getPlanningBySession(@PathVariable Long sessionId) {
        // This requires updating the repository interface
        return planningRepository.findBySessionId(sessionId);
    }

    @GetMapping("/semaine/{numeroSemaine}")
    public List<Planning> getPlanningBySemaine(@PathVariable Integer numeroSemaine) {
        return planningRepository.findByNumeroSemaine(numeroSemaine);
    }

    @GetMapping("/jour/{jourId}")
    public List<Planning> getPlanningByJourId(@PathVariable Long jourId) {
        return planningRepository.findByJourId(jourId);
    }

    @GetMapping("/role/{roleId}")
    public List<Planning> getPlanningByRoleId(@PathVariable Long roleId) {
        return planningRepository.findByRoleId(roleId);
    }

    @GetMapping("/membre/{membreId}")
    public List<Planning> getPlanningByMembreId(@PathVariable Long membreId) {
        return planningRepository.findByMembreId(membreId);
    }

    @GetMapping("/semaine/{numeroSemaine}/jour/{jourId}")
    public List<Planning> getPlanningBySemaineAndJour(@PathVariable Integer numeroSemaine, @PathVariable Long jourId) {
        return planningRepository.findByNumeroSemaineAndJourId(numeroSemaine, jourId);
    }

    @PostMapping
    public Planning createPlanning(@RequestBody Planning planning) {
        return planningRepository.save(planning);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Planning> updatePlanning(@PathVariable Long id, @RequestBody Planning planningDetails) {
        Optional<Planning> optionalPlanning = planningRepository.findById(id);
        if (optionalPlanning.isPresent()) {
            Planning planning = optionalPlanning.get();
            planning.setNumeroSemaine(planningDetails.getNumeroSemaine());
            planning.setJour(planningDetails.getJour());
            planning.setRole(planningDetails.getRole());
            planning.setMembre(planningDetails.getMembre());
            planning.setSession(planningDetails.getSession());
            planning.setDate(planningDetails.getDate());
            planning.setRoleName(planningDetails.getRoleName());
            planning.setMembreNom(planningDetails.getMembreNom());
            return ResponseEntity.ok(planningRepository.save(planning));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlanning(@PathVariable Long id) {
        if (planningRepository.existsById(id)) {
            planningRepository.deleteById(id);
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/reset")
    public ResponseEntity<Void> resetPlanning() {
        planningRepository.deleteAll();
        return ResponseEntity.ok().build();
    }
}