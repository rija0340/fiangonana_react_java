package com.example.demo.controller;

import com.example.demo.model.Kilasy;
import com.example.demo.repository.KilasyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/kilasys")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:8082"})
public class KilasyRestController {
    @Autowired
    private final KilasyRepository kilasyRepository;

    public KilasyRestController(KilasyRepository kilasyRepository) {
        this.kilasyRepository = kilasyRepository;
    }

    @GetMapping
    public ResponseEntity<List<Kilasy>> listKilasy() {
        List<Kilasy> kilasys = kilasyRepository.findAll();
        return ResponseEntity.ok(kilasys); 
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Kilasy> getKilasyById(@PathVariable Long id) {
        Optional<Kilasy> kilasy = kilasyRepository.findById(id);
        return kilasy.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<Kilasy> createKilasy(@RequestBody Kilasy kilasy) {
        System.out.println("Received kilasy: " + kilasy); 
        Kilasy savedKilasy = kilasyRepository.save(kilasy);
        return ResponseEntity.ok(savedKilasy);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Kilasy> updateKilasy(@PathVariable Long id, @RequestBody Kilasy kilasyDetails) {
        Optional<Kilasy> optionalKilasy = kilasyRepository.findById(id);
        
        if (optionalKilasy.isPresent()) {
            Kilasy kilasy = optionalKilasy.get();
            // Update fields
            kilasy.setNom(kilasyDetails.getNom());
            kilasy.setDescription(kilasyDetails.getDescription());
            kilasy.setObservations(kilasyDetails.getObservations());
            
            Kilasy updatedKilasy = kilasyRepository.save(kilasy);
            return ResponseEntity.ok(updatedKilasy);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteKilasy(@PathVariable Long id) {
        Optional<Kilasy> optionalKilasy = kilasyRepository.findById(id);
        
        if (optionalKilasy.isPresent()) {
            kilasyRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping
    public ResponseEntity<Void> deleteAllKilasys() {
        kilasyRepository.deleteAll();
        return ResponseEntity.noContent().build();
    }
}