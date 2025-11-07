package com.example.demo.controller;

import com.example.demo.model.Planning;
import com.example.demo.repository.PlanningRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/planning")
@CrossOrigin(origins = "http://localhost:5173")  // Vite default port
public class PlanningRestController {

    @Autowired
    private PlanningRepository planningRepository;

    @GetMapping
    public List<Planning> getAllPlanning() {
        return planningRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Planning> getPlanningById(@PathVariable Long id) {
        Optional<Planning> planning = planningRepository.findById(id);
        return planning.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
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