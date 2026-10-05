package com.project.webbasedtourismandtravelmanagementsystem;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class WebBasedTourismAndTravelManagementSystemApplication {

    public static void main(String[] args) {
        SpringApplication.run(WebBasedTourismAndTravelManagementSystemApplication.class, args);
    }

}
