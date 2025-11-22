package edu.bachelor.rest.config;

import edu.bachelor.rest.model.Format;
import edu.bachelor.rest.repository.FormatRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FormatDataInitializer {

  @Bean
  public CommandLineRunner initFormats(FormatRepository repository) {
    return args -> {
      if (repository.count() == 0) {
        repository.save(new Format(null, "jpg", "image/jpg"));
        repository.save(new Format(null, "png", "image/png"));
        repository.save(new Format(null, "pdf", "application/pdf"));
        System.out.println("Default formats inserted");
      } else {
        System.out.println("Formats table already populated, skipping...");
      }
    };
  }
}
