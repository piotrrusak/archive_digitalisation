package edu.bachelor.rest.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "auth")
class AuthProps {
    private String baseUrl;
    private String path;
    private int connectTimeoutMs = 1000;
    private int readTimeoutMs = 1500;
    private String bypassToken;
    
    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }
    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }
    public int getConnectTimeoutMs() { return connectTimeoutMs; }
    public void setConnectTimeoutMs(int connectTimeoutMs) { this.connectTimeoutMs = connectTimeoutMs; }
    public int getReadTimeoutMs() { return readTimeoutMs; }
    public void setReadTimeoutMs(int readTimeoutMs) { this.readTimeoutMs = readTimeoutMs; }
    public String getBypassToken() { return bypassToken; }
    public void setBypassToken(String bypassToken) { this.bypassToken = bypassToken; }

}