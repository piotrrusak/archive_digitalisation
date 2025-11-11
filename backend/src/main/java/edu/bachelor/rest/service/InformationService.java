package edu.bachelor.rest.service;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import edu.bachelor.rest.dto.AvailableModels;

@Service
@RequiredArgsConstructor
public class InformationService {

    private final WebClient webClient;
    
    @Value("${ocr.path}")
      private String ocrPath;
    
    @Transactional
    public AvailableModels getAvailableModels(HttpServletRequest request) {
        return this.webClient
                   .post()
                   .uri(this.ocrPath)
                   .header(HttpHeaders.AUTHORIZATION, request.getHeader(HttpHeaders.AUTHORIZATION))
                   .contentType(MediaType.APPLICATION_JSON)
                   .retrieve()
                   .bodyToMono(AvailableModels.class)
                   .block();
    }
}
