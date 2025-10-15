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
  
  @Value("${ocr.base-url}")
  private String ocrBaseUrl;

  @Value("${ocr.path}")
  private String ocrPath;

  @PostConstruct
  void initWebClient() {
    webClientBuilder.baseUrl(ocrBaseUrl).build();
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
    StoredFile storedFile = this.storedFileRepository.findById(id).orElseGet(null);
    return StoredFileDTO.fromStoredFile(
        storedFile, this.fileManager.getFile(storedFile.getResourcePath()));
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

    User owner =
        userRepository
            .findById(dto.ownerId())
            .orElseThrow(() -> new IllegalArgumentException("Owner not found: " + dto.ownerId()));

    Format format =
        formatRepository
            .findById(dto.formatId())
            .orElseThrow(() -> new IllegalArgumentException("Format not found: " + dto.formatId()));

    StoredFile primary = null;
    if (dto.primaryFileId() != null) {
      primary =
          storedFileRepository
              .findById(dto.primaryFileId())
              .orElseThrow(
                  () ->
                      new IllegalArgumentException(
                          "Primary file not found: " + dto.primaryFileId()));
    }

    
    final String path;
    try {
      path = fileManager.saveFile(dto.content());
    } catch (Exception e) {
      throw new RuntimeException("Failed to save file content", e);
    }

    if (dto.generation() <= 1) {
      this.webClient
          .post()
          .uri(this.ocrPath)
          .header(HttpHeaders.AUTHORIZATION, request.getHeader(HttpHeaders.AUTHORIZATION))
          .contentType(MediaType.APPLICATION_JSON)
          .bodyValue(dto)
          .retrieve()
          .bodyToMono(String.class)
          .block();
    }

    StoredFile entity = new StoredFile(null, owner, path, format, dto.generation(), primary);

    return storedFileRepository.save(entity);
  }

  public void deleteStoredFileById(Long id) {
    this.storedFileRepository.deleteById(id);
  }
}
