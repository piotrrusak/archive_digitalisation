package edu.bachelor.rest.service;

import edu.bachelor.rest.dto.AvailableModel;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

@Service
@RequiredArgsConstructor
public class InformationService {

  private final WebClient.Builder webClientBuilder;
  private WebClient webClient;

  @Value("${ocr.base-url}")
  private String ocrBaseUrl;

  @Value("${ocr.path}")
  private String ocrPath;

  @Value("${ocr.information-path}")
  private String informationPath;

  @PostConstruct
  void initWebClient() {
    this.webClient = webClientBuilder.baseUrl(ocrBaseUrl).build();
  }

  @Transactional
  public List<AvailableModel> getAvailableModels(HttpServletRequest request) {
    return this.webClient
        .get()
        .uri(this.informationPath)
        .header(HttpHeaders.AUTHORIZATION, request.getHeader(HttpHeaders.AUTHORIZATION))
        .accept(MediaType.APPLICATION_JSON)
        .retrieve()
        .bodyToMono(new ParameterizedTypeReference<List<AvailableModel>>() {})
        .block();
  }
}
