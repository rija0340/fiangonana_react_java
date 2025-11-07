package com.example.demo.repository;

import com.example.demo.model.Jour;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JourRepository extends JpaRepository<Jour, Long> {
}