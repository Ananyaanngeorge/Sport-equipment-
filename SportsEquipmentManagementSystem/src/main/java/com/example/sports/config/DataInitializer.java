package com.example.sports.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * DataInitializer: Configured for FRESH CODE state.
 * 
 * By default, no sample equipment, students, or loans are inserted.
 * This guarantees the project starts completely fresh with 0 pre-added items
 * and 0 created users, ready for college project demonstration from scratch.
 * 
 * If you ever need sample mock data for quick testing, change SEED_DEMO_DATA to true.
 */
@Component
public class DataInitializer implements CommandLineRunner {

    // By default false -> Pristine, fresh empty database state
    private static final boolean SEED_DEMO_DATA = false;

    @Override
    public void run(String... args) {
        if (!SEED_DEMO_DATA) {
            System.out.println("==================================================================");
            System.out.println(" Sports Equipment Management System: Fresh Empty Database Mode   ");
            System.out.println(" No pre-seeded equipment or users created. Ready for fresh input! ");
            System.out.println("==================================================================");
        }
    }
}
