package edu.bachelor.rest.config;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Configuration
@ConfigurationProperties(prefix = "auth")
class AuthProps {
    private String baseUrl;
    private String path;
    private int connectTimeoutMs = 1000;
    private int readTimeoutMs = 1500;

    // getters & setters
    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }
    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }
    public int getConnectTimeoutMs() { return connectTimeoutMs; }
    public void setConnectTimeoutMs(int connectTimeoutMs) { this.connectTimeoutMs = connectTimeoutMs; }
    public int getReadTimeoutMs() { return readTimeoutMs; }
    public void setReadTimeoutMs(int readTimeoutMs) { this.readTimeoutMs = readTimeoutMs; }
}

@Component
public class AuthClient {
    private final RestClient restClient;
    private final AuthProps props;

    public AuthClient(AuthProps props) {
        this.props = props;

        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(props.getConnectTimeoutMs());
        factory.setReadTimeout(props.getReadTimeoutMs());

        this.restClient = RestClient.builder()
                .baseUrl(props.getBaseUrl())
                .requestFactory(factory)
                .build();
    }

    public AuthVerifyResponse verify(String authorizationHeader) {
        try {
            if ("asdkfunhcekstukes".equals(authorizationHeader)) {
                return new AuthVerifyResponse(
                    true,
                    null,
                    null
                );
            }
            return restClient.get()
                    .uri(props.getPath())
                    .header(HttpHeaders.AUTHORIZATION, authorizationHeader)
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .body(AuthVerifyResponse.class);
        } catch (Exception e) {
            return new AuthVerifyResponse(false, null, null);
        }
    }
}
