package com.example.demo.controller;

import com.example.demo.model.Jour;
import com.example.demo.repository.JourRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/jours")
@CrossOrigin(origins = "http://localhost:5173")  // Vite default port
public class JourRestController {

    @Autowired
    private JourRepository jourRepository;

    @GetMapping
    public List<Jour> getAllJours() {
        return jourRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Jour> getJourById(@PathVariable Long id) {
        Optional<Jour> jour = jourRepository.findById(id);
        return jour.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Jour createJour(@RequestBody Jour jour) {
        return jourRepository.save(jour);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Jour> updateJour(@PathVariable Long id, @RequestBody Jour jourDetails) {
        Optional<Jour> optionalJour = jourRepository.findById(id);
        if (optionalJour.isPresent()) {
            Jour jour = optionalJour.get();
            jour.setNom(jourDetails.getNom());
            jour.setOrdreAffichage(jourDetails.getOrdreAffichage());
            return ResponseEntity.ok(jourRepository.save(jour));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteJour(@PathVariable Long id) {
        if (jourRepository.existsById(id)) {
            jourRepository.deleteById(id);
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}