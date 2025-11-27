package com.example.demo.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "planning_sessions")
public class PlanningSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom; // Name of the planning session

    private String description;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @JsonManagedReference
    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Planning> plannings;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "planning_session_dates", joinColumns = @JoinColumn(name = "session_id"))
    @Column(name = "date")
    private List<String> selectedDates;

    @Column(columnDefinition = "TEXT")
    private String customRoles; // JSON string

    // Configuration des disponibilités (JSON: "personId_date": boolean)
    @Column(name = "availability", columnDefinition = "TEXT")
    private String availability; // JSON string

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "planning_session_membres", joinColumns = @JoinColumn(name = "session_id"), inverseJoinColumns = @JoinColumn(name = "membre_id"))
    private List<Membre> selectedPeople;

    public PlanningSession() {
    }

    public PlanningSession(String nom) {
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public List<Planning> getPlannings() {
        return plannings;
    }

    public void setPlannings(List<Planning> plannings) {
        this.plannings = plannings;
    }

    public List<String> getSelectedDates() {
        return selectedDates;
    }

    public void setSelectedDates(List<String> selectedDates) {
        this.selectedDates = selectedDates;
    }

    public String getCustomRoles() {
        return customRoles;
    }

    public void setCustomRoles(String customRoles) {
        this.customRoles = customRoles;
    }

    public String getAvailability() {
        return availability;
    }

    public void setAvailability(String availability) {
        this.availability = availability;
    }

    public List<Membre> getSelectedPeople() {
        return selectedPeople;
    }

    public void setSelectedPeople(List<Membre> selectedPeople) {
        this.selectedPeople = selectedPeople;
    }
}