package com.example.demo.model;

import jakarta.persistence.*;

@Entity
@Table(name = "kilasys")
public class Kilasy {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String nom;
    private String description;
    private String observations;

    // Default constructor required by JPA
    public Kilasy() {}

    // Constructor
    public Kilasy(String nom, String description, String observations) {
        this.nom = nom;
        this.description = description;
        this.observations = observations;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getObservations() { return observations; }
    public void setObservations(String observations) { this.observations = observations; }
}