package com.example.demo.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

@Entity
@Table(name = "planning")
public class Planning {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Date spécifique (YYYY-MM-DD)
    @Column(name = "date")
    private String date;

    // Nom du rôle (pour les rôles personnalisés ou globaux)
    @Column(name = "role_name")
    private String roleName;

    // Numéro de la semaine
    @Column(name = "numero_semaine", nullable = true)
    private Integer numeroSemaine;

    // Référence au jour
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "jour_id", nullable = true)
    @JsonBackReference
    private Jour jour;

    // Référence au rôle
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", nullable = true)
    @JsonBackReference
    private Role role;

    // Référence au membre affecté
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "membre_id", nullable = true)
    @JsonBackReference
    private Membre membre;

    // Nom du membre (si pas dans la base)
    @Column(name = "membre_nom")
    private String membreNom;

    // Référence à la session de planning
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    @JsonBackReference
    private PlanningSession session;

    public Planning() {
    }

    public Planning(Integer numeroSemaine, Jour jour, Role role, Membre membre, PlanningSession session) {
        this.numeroSemaine = numeroSemaine;
        this.jour = jour;
        this.role = role;
        this.membre = membre;
        this.session = session;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getNumeroSemaine() {
        return numeroSemaine;
    }

    public void setNumeroSemaine(Integer numeroSemaine) {
        this.numeroSemaine = numeroSemaine;
    }

    public Jour getJour() {
        return jour;
    }

    public void setJour(Jour jour) {
        this.jour = jour;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public Membre getMembre() {
        return membre;
    }

    public void setMembre(Membre membre) {
        this.membre = membre;
    }

    public PlanningSession getSession() {
        return session;
    }

    public void setSession(PlanningSession session) {
        this.session = session;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getRoleName() {
        return roleName;
    }

    public void setRoleName(String roleName) {
        this.roleName = roleName;
    }

    public String getMembreNom() {
        return membreNom;
    }

    public void setMembreNom(String membreNom) {
        this.membreNom = membreNom;
    }
}