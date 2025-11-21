package edu.bachelor.rest.service;

import edu.bachelor.rest.dto.StoredFileDTO;
import edu.bachelor.rest.model.Format;
import edu.bachelor.rest.model.StoredFile;
import edu.bachelor.rest.model.User;
import edu.bachelor.rest.repository.FormatRepository;
import edu.bachelor.rest.repository.StoredFileRepository;
import edu.bachelor.rest.repository.UserRepository;
import edu.bachelor.rest.utils.AWSFileManager;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

@Service
@RequiredArgsConstructor
@Transactional
public class StoredFileService {

  private final StoredFileRepository storedFileRepository;
  private final UserRepository userRepository;
  private final FormatRepository formatRepository;
  private final AWSFileManager fileManager;
  private final WebClient.Builder webClientBuilder;
  private WebClient webClient;

  @Value("${ocr.base-url}")
  private String ocrBaseUrl;

  @Value("${ocr.path}")
  private String ocrPath;

  @PostConstruct
  void initWebClient() throws IllegalStateException {
    if (this.ocrBaseUrl == null) {
      throw new IllegalStateException("OCR base url is not configured");
    }
    if (this.ocrPath == null) {
      throw new IllegalStateException("OCR path is not configured");
    }

    this.webClient = webClientBuilder.baseUrl(ocrBaseUrl).build();
  }

  @Transactional(readOnly = true)
  public List<StoredFileDTO> getAllStoredFiles() {
    return this.storedFileRepository.findAll().stream()
        .map(
            file ->
                StoredFileDTO.fromStoredFile(
                    file, this.fileManager.getFile(file.getResourcePath())))
        .toList();
  }

  @Transactional(readOnly = true)
  public StoredFileDTO getFileById(Long id) {
    StoredFile storedFile = this.storedFileRepository.findById(id).orElse(null);
    return StoredFileDTO.fromStoredFile(
        storedFile, this.fileManager.getFile(storedFile.getResourcePath()));
  }

  @Transactional(readOnly = true)
  public byte[] exportFileById(Long id) {
    StoredFile storedFile = this.storedFileRepository.findById(id).orElse(null);
    return this.fileManager.getFile(storedFile.getResourcePath());
  }

  @Transactional(readOnly = true)
  public List<StoredFileDTO> getStoredFilesByOwnerId(Long id) {
    return this.storedFileRepository.findAll().stream()
        .map(
            file ->
                StoredFileDTO.fromStoredFile(
                    file, this.fileManager.getFile(file.getResourcePath())))
        .filter(storedFile -> storedFile.ownerId().equals(id))
        .toList();
  }

  public StoredFile saveStoredFile(HttpServletRequest request, StoredFileDTO dto) {

    final Long ownerId = java.util.Objects.requireNonNull(dto.ownerId(), "ownerId is null");
    User owner =
        userRepository
            .findById(ownerId)
            .orElseThrow(() -> new IllegalArgumentException("Owner not found: " + dto.ownerId()));

    final Long formatId = java.util.Objects.requireNonNull(dto.formatId(), "formatId is null");
    Format format =
        formatRepository
            .findById(formatId)
            .orElseThrow(() -> new IllegalArgumentException("Format not found: " + dto.formatId()));

    StoredFile primary = null;
    final Long primaryId = dto.primaryFileId();
    if (primaryId != null) {
      primary =
          storedFileRepository
              .findById(primaryId)
              .orElseThrow(
                  () -> new IllegalArgumentException("Primary file not found: " + primaryId));
    }

    final String path;
    try {
      path = fileManager.saveFile(dto.content());
    } catch (Exception e) {
      throw new RuntimeException("Failed to save file content", e);
    }

    StoredFile storedFile = StoredFileDTO.toStoredFile(dto, owner, format, primary, path);
    storedFile =
        java.util.Objects.requireNonNull(
            storedFile, "StoredFileDTO.toStoredFile returned null for dto=" + dto);
    StoredFile savedFile = storedFileRepository.save(storedFile);

    if (dto.generation() <= 1) {

      final MediaType json =
          java.util.Objects.requireNonNull(
              MediaType.APPLICATION_JSON, "MediaType.APPLICATION_JSON is null");

      this.webClient
          .post()
          .uri(this.ocrPath)
          .header(HttpHeaders.AUTHORIZATION, request.getHeader(HttpHeaders.AUTHORIZATION))
          .contentType(json)
          .bodyValue(dto)
          .retrieve()
          .bodyToMono(String.class)
          .block();
    }

    return savedFile;
  }

  public void deleteStoredFileById(Long id) {
    this.storedFileRepository.deleteById(id);
  }
}
