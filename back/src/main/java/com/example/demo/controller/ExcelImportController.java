package com.example.demo.controller;

import com.example.demo.service.ExcelImportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/excel")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:8082"})
public class ExcelImportController {

    @Autowired
    private ExcelImportService excelImportService;

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
}