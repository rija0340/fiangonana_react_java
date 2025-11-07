package com.example.demo.controller;

import com.example.demo.model.Role;
import com.example.demo.repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/roles")
@CrossOrigin(origins = "http://localhost:5173")  // Vite default port
public class RoleRestController {

    @Autowired
    private RoleRepository roleRepository;

    @GetMapping
    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Role> getRoleById(@PathVariable Long id) {
        Optional<Role> role = roleRepository.findById(id);
        return role.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/jour/{jourId}")
    public List<Role> getRolesByJourId(@PathVariable Long jourId) {
        return roleRepository.findByJourId(jourId);
    }

    @PostMapping
    public Role createRole(@RequestBody Role role) {
        return roleRepository.save(role);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Role> updateRole(@PathVariable Long id, @RequestBody Role roleDetails) {
        Optional<Role> optionalRole = roleRepository.findById(id);
        if (optionalRole.isPresent()) {
            Role role = optionalRole.get();
            role.setNom(roleDetails.getNom());
            role.setJour(roleDetails.getJour());
            return ResponseEntity.ok(roleRepository.save(role));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRole(@PathVariable Long id) {
        if (roleRepository.existsById(id)) {
            roleRepository.deleteById(id);
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}