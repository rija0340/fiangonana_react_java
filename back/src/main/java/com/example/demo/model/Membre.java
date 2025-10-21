package com.example.demo.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

@Entity
@Table(name = "membres")
public class Membre {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String nom;
    private String prenom;
    private String date_naissance;
    private String sexe;
    private String date_bapteme;
    private String categorie;
    private String telephone;
    private String situation_matrimoniale;
    private String occupation;
    private String observations;
    private String person_code;

    // Relationship with Famille
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "famille_id")
    @JsonBackReference
    private Famille famille;

    // Default constructor required by JPA
    public Membre() {}

    // Constructor
    public Membre(String nom, String prenom, String date_naissance, String sexe, 
                 String date_bapteme, String categorie, String telephone, String situation_matrimoniale, 
                 String occupation, String observations, String person_code) {
        this.nom = nom;
        this.prenom = prenom;
        this.date_naissance = date_naissance;
        this.sexe = sexe;
        this.date_bapteme = date_bapteme;
        this.telephone = telephone;
        this.situation_matrimoniale = situation_matrimoniale;
        this.occupation = occupation;
        this.observations = observations;
        this.categorie = categorie;
        this.person_code = person_code;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }
    public String getDate_naissance() { return date_naissance; }
    public void setDate_naissance(String date_naissance) { this.date_naissance = date_naissance; }
    public String getSexe() { return sexe; }
    public void setSexe(String sexe) { this.sexe = sexe; }
    public String getDate_bapteme() { return date_bapteme; }
    public void setDate_bapteme(String date_bapteme) { this.date_bapteme = date_bapteme; }
    public String getTelephone() { return telephone; }
    public void setTelephone(String telephone) { this.telephone = telephone; }
    public String getSituation_matrimoniale() { return situation_matrimoniale; }
    public void setSituation_matrimoniale(String situation_matrimoniale) { this.situation_matrimoniale = situation_matrimoniale; }
    public String getOccupation() { return occupation; }
    public void setOccupation(String occupation) { this.occupation = occupation; }
    public String getObservations() { return observations; }
    public void setObservations(String observations) { this.observations = observations; }
    public String getPerson_code() { return person_code; }
    public void setPerson_code(String person_code) { this.person_code = person_code; }
    public String getCategorie() { return categorie; }
    public void setCategorie(String categorie) { this.categorie = categorie; }
    // Famille relationship getters and setters
    public Famille getFamille() { return famille; }
    public void setFamille(Famille famille) { this.famille = famille; }
}

