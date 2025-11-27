package com.example.demo.dto;

public class PlanningAssignmentDTO {
    private Long sessionId;
    private String date;
    private String roleName;
    private String membreNom;

    // Constructors
    public PlanningAssignmentDTO() {
    }

    public PlanningAssignmentDTO(Long sessionId, String date, String roleName, String membreNom) {
        this.sessionId = sessionId;
        this.date = date;
        this.roleName = roleName;
        this.membreNom = membreNom;
    }

    // Getters and Setters
    public Long getSessionId() {
        return sessionId;
    }

    public void setSessionId(Long sessionId) {
        this.sessionId = sessionId;
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
