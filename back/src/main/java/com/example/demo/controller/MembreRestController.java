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
@RequestMapping("/api/membres")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:8082"})
public class MembreRestController {
    @Autowired
    private final MembreRepository membreRepository;
    
    @Autowired
    private final FamilleRepository familleRepository;

    public MembreRestController(MembreRepository membreRepository, FamilleRepository familleRepository) {
        this.membreRepository = membreRepository;
        this.familleRepository = familleRepository;
    }

    @GetMapping
    public ResponseEntity<List<Membre>> listMembre(
        @RequestParam(required = false) String sexe,
        @RequestParam(required = false) String baptise,
        @RequestParam(required = false) String search,
        @RequestParam(required = false) String categorie,
        @RequestParam(required = false) String source
    ) {
        System.out.println("Received sexe: " + sexe + " and baptise: " + baptise + " and search: " + search + " and categorie: " + categorie + " and source: " + source);
        List<Membre> membres = membreRepository.findAll();
        
        if (sexe != null && !sexe.equalsIgnoreCase("all")) {
                membres = membres.stream()
                        .filter(m -> m.getSexe().equalsIgnoreCase(sexe))
                        .toList();
            }

            if (baptise != null) {

                if(baptise.equalsIgnoreCase("true")){
                    membres = membres.stream()
                        .filter(m -> m.getDate_bapteme() != null)
                        .toList();
                }
                if(baptise.equalsIgnoreCase("false")){
                    membres = membres.stream()
                        .filter(m -> m.getDate_bapteme() == null)
                        .toList();
                }
            }

            if (search != null && !search.isEmpty()) {
                membres = membres.stream()
                        .filter(m -> m.getNom().toLowerCase().contains(search.toLowerCase()) ||
                                    m.getPrenom().toLowerCase().contains(search.toLowerCase()))
                        .toList();
            }
            
            if (categorie != null) {
                if (categorie.equalsIgnoreCase("non_categorie")) {
                    // Filter members with empty or null categories
                    membres = membres.stream()
                            .filter(m -> m.getCategorie() == null || m.getCategorie().isEmpty() || m.getCategorie().trim().isEmpty())
                            .toList();
                }else if (categorie.equalsIgnoreCase("categorie")) {
                    // Filter members with specific category
                    membres = membres.stream()
                            .filter(m -> m.getCategorie() != null)
                            .toList();
                }else if (!categorie.equalsIgnoreCase("all")) {
                    // Filter members with specific category
                    membres = membres.stream()
                            .filter(m -> m.getCategorie() != null && m.getCategorie().equalsIgnoreCase(categorie))
                            .toList();
                }
            }
            //syntax pour java 14 +
            // if (source != null) {
            //     membres = switch (categorie.toLowerCase()) {
            //         case "acms" -> membres.stream()
            //             .filter(m -> {
            //                 String src = m.getSource();
            //                 return src == null || src.trim().isEmpty() || src.equalsIgnoreCase(source);
            //             })
            //             .toList();
                        
            //         case "autre" -> membres.stream()
            //             .filter(m -> source.equalsIgnoreCase(m.getSource()))
            //             .toList();
                        
            //         case "all" -> membres; // No filtering needed for "all"
                        
            //         default -> membres.stream()
            //             .filter(m -> source.equalsIgnoreCase(m.getSource()))
            //             .toList();
            //     };
            // }

            if (source != null) {
                switch (source.toLowerCase()) {
                    case "acms":
                        membres = membres.stream()
                            .filter(m -> {
                                String src = m.getSource();
                                return src == null || src.trim().isEmpty() || src.equalsIgnoreCase(source);
                            })
                            .toList();
                        break;
                        
                    case "manuel":
                        membres = membres.stream()
                            .filter(m -> source.equalsIgnoreCase(m.getSource()))
                            .toList();
                        break;
                        
                    case "all":
                        // No filtering needed for "all"
                        break;
                        
                    default:
                        membres = membres.stream()
                            .filter(m -> source.equalsIgnoreCase(m.getSource()))
                            .toList();
                        break;
                }
            }


            return ResponseEntity.ok(membres);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Membre> getMembreById(@PathVariable Long id) {
        Optional<Membre> membre = membreRepository.findById(id);
        return membre.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<Membre> createMembre(@RequestBody Membre membre) {
        System.out.println("Received user: " + membre); 

        // Handle famille assignment if provided
        if (membre.getFamille() != null && membre.getFamille().getId() != null) {
            Optional<Famille> famille = familleRepository.findById(membre.getFamille().getId());
            if (famille.isPresent()) {
                membre.setFamille(famille.get());
            }
        }
        membre.setSource("manuel");
        Membre savedMembre = membreRepository.save(membre);
        return ResponseEntity.ok(savedMembre);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Membre> updateMembre(@PathVariable Long id, @RequestBody Membre membreDetails) {
        Optional<Membre> optionalMembre = membreRepository.findById(id);
        
        if (optionalMembre.isPresent()) {
            Membre membre = optionalMembre.get();
            // Update all fields
            membre.setNom(membreDetails.getNom());
            membre.setPrenom(membreDetails.getPrenom());
            membre.setDate_naissance(membreDetails.getDate_naissance());
            membre.setSexe(membreDetails.getSexe());
            membre.setDate_bapteme(membreDetails.getDate_bapteme());
            membre.setTelephone(membreDetails.getTelephone());
            membre.setSituation_matrimoniale(membreDetails.getSituation_matrimoniale());
            membre.setOccupation(membreDetails.getOccupation());
            membre.setObservations(membreDetails.getObservations());
            membre.setPerson_code(membreDetails.getPerson_code());
            
            // Handle famille assignment if provided
            if (membreDetails.getFamille() != null) {
                if (membreDetails.getFamille().getId() != null) {
                    Optional<Famille> famille = familleRepository.findById(membreDetails.getFamille().getId());
                    if (famille.isPresent()) {
                        membre.setFamille(famille.get());
                    }
                } else {
                    membre.setFamille(null); // Remove famille if id is null
                }
            }

            Membre updatedMembre = membreRepository.save(membre);
            return ResponseEntity.ok(updatedMembre);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMembre(@PathVariable Long id) {
        Optional<Membre> optionalMembre = membreRepository.findById(id);
        
        if (optionalMembre.isPresent()) {
            membreRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping
    public ResponseEntity<Void> deleteAllMembres() {
        membreRepository.deleteAll();
        return ResponseEntity.noContent().build();
    }
    
    // Additional endpoint to get membres by famille
    @GetMapping("/famille/{familleId}")
    public ResponseEntity<List<Membre>> getMembresByFamilleId(@PathVariable Long familleId) {
        Optional<Famille> famille = familleRepository.findById(familleId);
        if (famille.isPresent()) {
            List<Membre> membres = membreRepository.findByFamilleId(familleId);
            return ResponseEntity.ok(membres);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    // Endpoint to get all unique categories
    @GetMapping("/categories")
    public ResponseEntity<List<String>> getAllCategories() {
        List<String> categories = membreRepository.findAll()
                .stream()
                .map(Membre::getCategorie)
                .filter(categorie -> categorie != null && !categorie.trim().isEmpty())
                .distinct()
                .sorted()
                .toList();
        
        return ResponseEntity.ok(categories);
    }
}