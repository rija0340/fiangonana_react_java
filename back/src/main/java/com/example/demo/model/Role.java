package com.example.demo.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

@Entity
@Table(name = "roles")
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    // Référence au jour auquel appartient ce rôle
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "jour_id")
    @JsonBackReference
    private Jour jour;

    public Role() {}

    public Role(String nom, Jour jour) {
        this.nom = nom;
        this.jour = jour;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNom() {
        return nom;
    }

    public void setNom(String nom) {
        this.nom = nom;
    }

    public Jour getJour() {
        return jour;
    }

    public void setJour(Jour jour) {
        this.jour = jour;
    }
}