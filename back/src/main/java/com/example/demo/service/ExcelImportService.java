package com.example.demo.service;

import com.example.demo.model.Membre;
import com.example.demo.repository.MembreRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

@Service
public class ExcelImportService {

    @Autowired
    private MembreRepository membreRepository;

    public List<Membre> importFromExcel(MultipartFile file) throws IOException {
        List<Membre> membres = new ArrayList<>();
        
        try (InputStream inputStream = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(inputStream)) {
             
            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rows = sheet.iterator();
            
            // Skip header row
            if (rows.hasNext()) {
                rows.next();
            }
            
            int rowNum = 1; // Start from 1 since we skip header
            while (rows.hasNext()) {
                Row currentRow = rows.next();
                rowNum++;
                
                Membre membre = mapRowToMembre(currentRow);
                if (membre != null) {
                    // Validate the membre object
                    // String validationError = validateMembre(membre, rowNum);
                    // if (validationError == null) {
                        membres.add(membre);
                    // } else {
                    //     System.out.println("Validation error at row " + rowNum + ": " + validationError);
                    // }
                } else {
                    System.out.println("Skipping invalid row " + rowNum);
                }
            }
        }
        
        // Save all membres to database
        return membreRepository.saveAll(membres);
    }

    private String validateMembre(Membre membre, int rowNum) {
        // Basic validation
        if (membre.getNom() == null || membre.getNom().trim().isEmpty()) {
            return "Row " + rowNum + ": Name is required";
        }
        
        // Validate date formats if provided
        if (membre.getDate_naissance() != null && !membre.getDate_naissance().trim().isEmpty()) {
            if (!isValidDate(membre.getDate_naissance())) {
                return "Row " + rowNum + ": Invalid date of birth format";
            }
        }
        
        if (membre.getDate_bapteme() != null && !membre.getDate_bapteme().trim().isEmpty()) {
            if (!isValidDate(membre.getDate_bapteme())) {
                return "Row " + rowNum + ": Invalid baptism date format";
            }
        }
        
        // Add other validations as needed
        return null; // No validation errors
    }
    
    private boolean isValidDate(String dateStr) {
        try {
            LocalDate.parse(dateStr);
            return true;
        } catch (DateTimeParseException e) {
            return false;
        }
    }

    private Membre mapRowToMembre(Row row) {
        Membre membre = new Membre();
        
        try {
            // Get cell values based on the provided mapping
            String personCode = getCellValueAsString(row.getCell(0)); // person_code
            String nom = getCellValueAsString(row.getCell(10)); // nom
            String prenom = getCellValueAsString(row.getCell(11)); // nom_de_famille (maps to prenom in Membre)
            String dateNaissance = parseDate(getCellValueAsString(row.getCell(16))); // date_naissance
            String telephone = getCellValueAsString(row.getCell(21)); // telephone
            String sexe = getCellValueAsString(row.getCell(26)); // sexe
            String situationMatrimoniale = getCellValueAsString(row.getCell(27)); // situation_matrimoniale
            String occupation = getCellValueAsString(row.getCell(31)); // occupation
            String dateBapteme = parseDate(getCellValueAsString(row.getCell(41))); // date_bapteme
            String categorie = parseDate(getCellValueAsString(row.getCell(48))); // categorie
            String observations = getCellValueAsString(row.getCell(50)); // observations

            System.out.println("Processing row data - Nom: " + nom + ", Person Code: " + personCode);

            // Set values to membre object
            membre.setPerson_code(personCode);
            membre.setNom(nom);
            membre.setPrenom(prenom);
            membre.setDate_naissance(dateNaissance);
            membre.setTelephone(telephone);
            membre.setSexe(sexe);
            membre.setSituation_matrimoniale(situationMatrimoniale);
            membre.setOccupation(occupation);
            membre.setDate_bapteme(dateBapteme);
            membre.setCategorie(categorie);
            membre.setObservations(observations);

            // Validate required fields
            if (nom != null && !nom.trim().isEmpty()) {
                return membre;
            } else {
                System.out.println("Skipping row with empty name or invalid data");
                return null;
            }
        } catch (Exception e) {
            System.err.println("Error processing row: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) {
            return null;
        }
        
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue().toString();
                } else {
                    // Handle numeric values (like phone numbers)
                    double numericValue = cell.getNumericCellValue();
                    // Check if it's a whole number (likely an ID or phone number)
                    if (numericValue == Math.floor(numericValue)) {
                        return String.valueOf((long) numericValue);
                    } else {
                        return String.valueOf(numericValue);
                    }
                }
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                return cell.getCellFormula();
            case BLANK:
                return null;
            default:
                return null;
        }
    }

    private String parseDate(String dateStr) {
        if (dateStr == null || dateStr.trim().isEmpty()) {
            return null;
        }
        
        // Try different date formats commonly used
        String[] formats = {
            "dd/MM/yyyy", "yyyy-MM-dd", "MM/dd/yyyy", "dd-MM-yyyy", 
            "yyyy/MM/dd", "dd.MM.yyyy", "MM-dd-yyyy"
        };
        
        for (String format : formats) {
            try {
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern(format);
                LocalDate date = LocalDate.parse(dateStr, formatter);
                return date.toString(); // Store as ISO format string
            } catch (DateTimeParseException e) {
                // Continue to next format
            }
        }
        
        // If no format matches, return the original string
        return dateStr;
    }
}