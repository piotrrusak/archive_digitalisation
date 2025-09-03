package edu.bachelor.rest.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import lombok.Getter;
import lombok.Setter;

@Configuration
@ConfigurationProperties(prefix = "auth")
@Getter @Setter
public class AuthProps {
    private String baseUrl;
    private String path;
    private int connectTimeoutMs = 1000;
    private int readTimeoutMs = 1500;
    private String bypassToken;
}