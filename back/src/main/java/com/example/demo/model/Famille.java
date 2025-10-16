package com.example.demo.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;

import java.util.List;

@Entity
@Table(name = "familles")
public class Famille {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String nom;
    private String observations;

    // Relationship with Membres - One Famille can have many Membres
    @OneToMany(mappedBy = "famille", fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<Membre> membres;

    // Default constructor required by JPA
    public Famille() {}

    // Constructor
    public Famille(String nom, String observations) {
        this.nom = nom;
        this.observations = observations;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
    public String getObservations() { return observations; }
    public void setObservations(String observations) { this.observations = observations; }
    
    // Membres relationship getters and setters
    public List<Membre> getMembres() { return membres; }
    public void setMembres(List<Membre> membres) { this.membres = membres; }
}

