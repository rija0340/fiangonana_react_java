package com.example.demo.config;

import com.example.demo.model.Jour;
import com.example.demo.repository.JourRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(JourRepository jourRepository) {
        return args -> {
            // Check if jours already exist
            if (jourRepository.count() == 0) {
                // Create default jours (days of the week)
                Jour dimanche = new Jour("Dimanche");
                dimanche.setOrdreAffichage(0);
                jourRepository.save(dimanche);

                Jour lundi = new Jour("Lundi");
                lundi.setOrdreAffichage(1);
                jourRepository.save(lundi);

                Jour mardi = new Jour("Mardi");
                mardi.setOrdreAffichage(2);
                jourRepository.save(mardi);

                Jour mercredi = new Jour("Mercredi");
                mercredi.setOrdreAffichage(3);
                jourRepository.save(mercredi);

                Jour jeudi = new Jour("Jeudi");
                jeudi.setOrdreAffichage(4);
                jourRepository.save(jeudi);

                Jour vendredi = new Jour("Vendredi");
                vendredi.setOrdreAffichage(5);
                jourRepository.save(vendredi);

                Jour samedi = new Jour("Samedi");
                samedi.setOrdreAffichage(6);
                jourRepository.save(samedi);

                System.out.println("✅ Database initialized with default jours (days of the week)");
            } else {
                System.out.println("ℹ️  Jours already exist in database, skipping initialization");
            }
        };
    }
}

