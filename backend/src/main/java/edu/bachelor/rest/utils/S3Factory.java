package edu.bachelor.rest.utils;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

@Configuration
public class S3Factory {
    @Bean
    public S3Client s3() {
        return S3Client.builder()
            .region(Region.EU_CENTRAL_1)
            // .credentialsProvider(ProfileCredentialsProvider.create("archive_digitalisation"))
            .build();
    }
}
