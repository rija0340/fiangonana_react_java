package com.example.demo.dto;

import java.time.LocalDateTime;
import java.util.List;

public class PlanningSessionDTO {
    private Long id;
    private String nom;
    private String description;
    private LocalDateTime createdAt;
    private List<String> selectedDates;
    private String customRoles;
    private List<String> selectedPeople; // personCodes, not full Membre objects

    // Getters and setters
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

    public List<String> getSelectedPeople() {
        return selectedPeople;
    }

    public void setSelectedPeople(List<String> selectedPeople) {
        this.selectedPeople = selectedPeople;
    }
}