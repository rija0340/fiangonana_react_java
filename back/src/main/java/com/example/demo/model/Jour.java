package com.example.demo.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.util.List;

@Entity
@Table(name = "jours")
public class Jour {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    // Ordre d'affichage
    @Column(name = "ordre_affichage")
    private Integer ordreAffichage;

    @JsonIgnore
    @OneToMany(mappedBy = "jour", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Role> roles;

    public Jour() {}

    public Jour(String nom) {
        this.nom = nom;
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

    public Integer getOrdreAffichage() {
        return ordreAffichage;
    }

    public void setOrdreAffichage(Integer ordreAffichage) {
        this.ordreAffichage = ordreAffichage;
    }

    public List<Role> getRoles() {
        return roles;
    }

    public void setRoles(List<Role> roles) {
        this.roles = roles;
    }
}