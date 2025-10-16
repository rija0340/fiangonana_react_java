package com.example.demo.controller;

import com.example.demo.model.Famille;
import com.example.demo.model.Membre;
import com.example.demo.repository.FamilleRepository;
import com.example.demo.repository.MembreRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/familles")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:8082"})
public class FamilleRestController {
    @Autowired
    private final FamilleRepository familleRepository;
    
    @Autowired
    private final MembreRepository membreRepository;

    public FamilleRestController(FamilleRepository familleRepository, MembreRepository membreRepository) {
        this.familleRepository = familleRepository;
        this.membreRepository = membreRepository;
    }

    @GetMapping
    public ResponseEntity<List<Famille>> listFamille() {
        List<Famille> familles = familleRepository.findAll();

        return ResponseEntity.ok(familles); 
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Famille> getFamilleById(@PathVariable Long id) {
        Optional<Famille> famille = familleRepository.findByIdWithMembres(id);
        return famille.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<Famille> createFamille(@RequestBody Famille famille) {
        System.out.println("Received famille: " + famille); 
        Famille savedFamille = familleRepository.save(famille);
        return ResponseEntity.ok(savedFamille);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Famille> updateFamille(@PathVariable Long id, @RequestBody Famille familleDetails) {
        Optional<Famille> optionalFamille = familleRepository.findById(id);
        
        if (optionalFamille.isPresent()) {
            Famille famille = optionalFamille.get();
            // Update fields
            famille.setNom(familleDetails.getNom());
            famille.setObservations(familleDetails.getObservations());
            
            Famille updatedFamille = familleRepository.save(famille);
            return ResponseEntity.ok(updatedFamille);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFamille(@PathVariable Long id) {
        Optional<Famille> optionalFamille = familleRepository.findById(id);
        
        if (optionalFamille.isPresent()) {
            familleRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping
    public ResponseEntity<Void> deleteAllFamilles() {
        familleRepository.deleteAll();
        return ResponseEntity.noContent().build();
    }
    
    // Endpoint to add members to a famille
    @PostMapping("/{familleId}/membres")
    public ResponseEntity<Famille> addMembersToFamille(@PathVariable Long familleId, @RequestBody List<Long> memberIds) {
        System.out.println("Received familleId: " + familleId + " and memberIds: " + memberIds);
        Optional<Famille> familleOpt = familleRepository.findByIdWithMembres(familleId);
        if (familleOpt.isPresent()) {
            Famille famille = familleOpt.get();
            
            // Update each member's famille
            for (Long memberId : memberIds) {
                Optional<Membre> membreOpt = membreRepository.findById(memberId);
                if (membreOpt.isPresent()) {
                    Membre membre = membreOpt.get();
                    membre.setFamille(famille);
                    membreRepository.save(membre);
                }
            }
            
            // Return the updated famille with its members
            return ResponseEntity.ok(familleRepository.findByIdWithMembres(familleId).get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}