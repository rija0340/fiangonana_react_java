package com.example.demo.model;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "availabilities")
public class Availability {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "membre_id", nullable = false)
    private Membre membre;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private PlanningSession planningSession;

    @Column(nullable = false)
    private LocalDate date;

    private boolean disponible = true;

    public Availability() {}

    public Availability(Membre membre, PlanningSession planningSession, LocalDate date, boolean disponible) {
        this.membre = membre;
        this.planningSession = planningSession;
        this.date = date;
        this.disponible = disponible;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Membre getMembre() {
        return membre;
    }

    public void setMembre(Membre membre) {
        this.membre = membre;
    }

    public PlanningSession getPlanningSession() {
        return planningSession;
    }

    public void setPlanningSession(PlanningSession planningSession) {
        this.planningSession = planningSession;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public boolean isDisponible() {
        return disponible;
    }

    public void setDisponible(boolean disponible) {
        this.disponible = disponible;
    }
}