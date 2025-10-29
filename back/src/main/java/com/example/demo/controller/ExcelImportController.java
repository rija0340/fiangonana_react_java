package com.example.demo.controller;

import com.example.demo.model.Membre;
import com.example.demo.repository.MembreRepository;
import com.example.demo.service.ExcelImportService;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFRow;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/excel")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:8082"})
public class ExcelImportController {

    @Autowired
    private ExcelImportService excelImportService;
    
    @Autowired
    private MembreRepository membreRepository;

    @PostMapping("/membres/import")
    public ResponseEntity<Map<String, Object>> importExcel(@RequestParam("file") MultipartFile file) {
        Map<String, Object> response = new HashMap<>();
        
        if (file.isEmpty()) {
            response.put("success", false);
            response.put("message", "Please select an Excel file to upload.");
            return ResponseEntity.badRequest().body(response);
        }

        if (!hasExcelFormat(file)) {
            response.put("success", false);
            response.put("message", "Please upload a valid Excel file (.xlsx or .xls)");
            return ResponseEntity.badRequest().body(response);
        }

        try {
            int importedCount = excelImportService.importFromExcel(file).size();
            response.put("success", true);
            response.put("message", "Successfully imported " + importedCount + " members from Excel file.");
            response.put("importedCount", importedCount);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Error processing Excel file: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    private boolean hasExcelFormat(MultipartFile file) {
        // Check if the file has a valid Excel extension
        String fileName = file.getOriginalFilename();
        return fileName != null && (fileName.endsWith(".xlsx") || fileName.endsWith(".xls"));
    }
    
    @GetMapping("/membres/export")
    public ResponseEntity<ByteArrayResource> exportMembres(
            @RequestParam(required = false) String sexe,
            @RequestParam(required = false) String baptise,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String categorie,
            @RequestParam(required = false) String source) {
        
        try {
            // Get all membres and apply the same filtering logic as in MembreRestController
            List<Membre> membres = membreRepository.findAll();
            
            if (sexe != null && !sexe.equalsIgnoreCase("all")) {
                membres = membres.stream()
                        .filter(m -> m.getSexe().equalsIgnoreCase(sexe))
                        .toList();
            }

            if (baptise != null) {
                if(baptise.equalsIgnoreCase("true")){
                    membres = membres.stream()
                        .filter(m -> m.getDate_bapteme() != null)
                        .toList();
                }
                if(baptise.equalsIgnoreCase("false")){
                    membres = membres.stream()
                        .filter(m -> m.getDate_bapteme() == null)
                        .toList();
                }
            }

            if (search != null && !search.isEmpty()) {
                membres = membres.stream()
                        .filter(m -> m.getNom().toLowerCase().contains(search.toLowerCase()) ||
                                    m.getPrenom().toLowerCase().contains(search.toLowerCase()))
                        .toList();
            }
            
            if (categorie != null) {
                if (categorie.equalsIgnoreCase("non_categorie")) {
                    // Filter members with empty or null categories
                    membres = membres.stream()
                            .filter(m -> m.getCategorie() == null || m.getCategorie().isEmpty() || m.getCategorie().trim().isEmpty())
                            .toList();
                }else if (categorie.equalsIgnoreCase("categorie")) {
                    // Filter members with non-null categories
                    membres = membres.stream()
                            .filter(m -> m.getCategorie() != null)
                            .toList();
                }else if (!categorie.equalsIgnoreCase("all")) {
                    // Filter members with specific category
                    membres = membres.stream()
                            .filter(m -> m.getCategorie() != null && m.getCategorie().equalsIgnoreCase(categorie))
                            .toList();
                }
            }

            if (source != null) {
                switch (source.toLowerCase()) {
                    case "acms":
                        membres = membres.stream()
                            .filter(m -> {
                                String src = m.getSource();
                                return src == null || src.trim().isEmpty() || src.equalsIgnoreCase(source);
                            })
                            .toList();
                        break;
                        
                    case "manuel":
                        membres = membres.stream()
                            .filter(m -> source.equalsIgnoreCase(m.getSource()))
                            .toList();
                        break;
                        
                    case "all":
                        // No filtering needed for "all"
                        break;
                        
                    default:
                        membres = membres.stream()
                            .filter(m -> source.equalsIgnoreCase(m.getSource()))
                            .toList();
                        break;
                }
            }

            // Create workbook and sheet
            XSSFWorkbook workbook = new XSSFWorkbook();
            XSSFSheet sheet = workbook.createSheet("Membres");
            
            // Create header row
            XSSFRow headerRow = sheet.createRow(0);
            String[] headers = { "Person code", "Nom", "Prénom", "Date de naissance", "Sexe", "Date de bapteme",
                               "Téléphone", "Situation matrimoniale", "Occupation", "Observations", 
                               "Person code", "Catégorie", "Source"};
            
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                // Make header bold
                CellStyle headerStyle = workbook.createCellStyle();
                Font font = workbook.createFont();
                font.setBold(true);
                headerStyle.setFont(font);
                cell.setCellStyle(headerStyle);
            }
            
            // Fill data rows
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            for (int i = 0; i < membres.size(); i++) {
                XSSFRow row = sheet.createRow(i + 1);
                Membre membre = membres.get(i);

                row.createCell(0).setCellValue(membre.getPerson_code() != null ? membre.getPerson_code() : "");
                row.createCell(1).setCellValue(membre.getNom() != null ? membre.getNom() : "");
                row.createCell(2).setCellValue(membre.getPrenom() != null ? membre.getPrenom() : "");
                row.createCell(3).setCellValue(membre.getDate_naissance() != null ? membre.getDate_naissance().toString() : "");
                row.createCell(4).setCellValue(membre.getSexe() != null ? membre.getSexe() : "");
                row.createCell(5).setCellValue(membre.getDate_bapteme() != null ? membre.getDate_bapteme().toString() : "");
                row.createCell(6).setCellValue(membre.getTelephone() != null ? membre.getTelephone() : "");
                row.createCell(7).setCellValue(membre.getSituation_matrimoniale() != null ? membre.getSituation_matrimoniale() : "");
                row.createCell(8).setCellValue(membre.getOccupation() != null ? membre.getOccupation() : "");
                row.createCell(9).setCellValue(membre.getObservations() != null ? membre.getObservations() : "");
                row.createCell(10).setCellValue(membre.getCategorie() != null ? membre.getCategorie() : "");
                row.createCell(11).setCellValue(membre.getSource() != null ? membre.getSource() : "");
            }
            
            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }
            
            // Write to byte array
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            workbook.close();
            
            byte[] bytes = outputStream.toByteArray();
            ByteArrayResource resource = new ByteArrayResource(bytes);
            
            HttpHeaders headersResponse = new HttpHeaders();
            headersResponse.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=membres_export.xlsx");
            headersResponse.add(HttpHeaders.CONTENT_TYPE, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            
            return ResponseEntity.ok()
                    .headers(headersResponse)
                    .contentLength(bytes.length)
                    .body(resource);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}