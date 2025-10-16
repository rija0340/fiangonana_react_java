package com.example.demo.repository;

import com.example.demo.model.Kilasy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface KilasyRepository extends JpaRepository<Kilasy, Long> {
}