package com.example.demo.service;

import com.example.demo.dto.PlanningSessionDTO;
import com.example.demo.model.Membre;
import com.example.demo.model.PlanningSession;
import com.example.demo.repository.MembreRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PlanningSessionService {

    @Autowired
    private MembreRepository membreRepository;

    /**
     * Convertit un PlanningSessionDTO en PlanningSession entité
     * 
     * @param dto le DTO à convertir
     * @return l'entité PlanningSession
     */
    public PlanningSession fromDto(PlanningSessionDTO dto) {
        PlanningSession session = new PlanningSession();
        session.setId(dto.getId());
        session.setNom(dto.getNom());
        session.setDescription(dto.getDescription());
        session.setSelectedDates(dto.getSelectedDates());
        session.setCustomRoles(dto.getCustomRoles());
        session.setAvailability(dto.getAvailability());

        // Convertir les personCodes en objets Membre
        if (dto.getSelectedPeople() != null && !dto.getSelectedPeople().isEmpty()) {
            List<Membre> membres = membreRepository.findByPersonCodeIn(dto.getSelectedPeople());
            session.setSelectedPeople(membres);
        } else {
            session.setSelectedPeople(new ArrayList<>()); // Liste vide
        }

        return session;
    }

    /**
     * Convertit un PlanningSession entité en PlanningSessionDTO
     * 
     * @param entity l'entité à convertir
     * @return le DTO correspondant
     */
    public PlanningSessionDTO toDto(PlanningSession entity) {
        PlanningSessionDTO dto = new PlanningSessionDTO();
        dto.setId(entity.getId());
        dto.setNom(entity.getNom());
        dto.setDescription(entity.getDescription());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setSelectedDates(entity.getSelectedDates());
        dto.setCustomRoles(entity.getCustomRoles());
        dto.setAvailability(entity.getAvailability());

        // Convertir les objets Membre en personCodes
        if (entity.getSelectedPeople() != null) {
            List<String> personCodes = entity.getSelectedPeople().stream()
                    .map(Membre::getPerson_code)
                    .collect(Collectors.toList());
            dto.setSelectedPeople(personCodes);
        }

        return dto;
    }
}