package edu.bachelor.rest.service;

import com.syncfusion.ej2.wordprocessor.FormatType;
import com.syncfusion.ej2.wordprocessor.WordProcessorHelper;
import edu.bachelor.rest.dto.StoredFileDTO;
import edu.bachelor.rest.model.Format;
import edu.bachelor.rest.model.StoredFile;
import edu.bachelor.rest.model.User;
import edu.bachelor.rest.repository.FormatRepository;
import edu.bachelor.rest.repository.StoredFileRepository;
import edu.bachelor.rest.repository.UserRepository;
import edu.bachelor.rest.utils.AWSFileManager;
import edu.bachelor.rest.utils.FormatConverter;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
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
    this.webClient =
        webClientBuilder
            .baseUrl(
                Objects.requireNonNull(
                    this.ocrBaseUrl,
                    "initWebClient - this.ocrBaseUrl must not be null. Check resources"))
            .build();
  }

  // Get

  @Transactional(readOnly = true)
  public List<StoredFileDTO> getAllStoredFiles(boolean fetchContent) {
    if (fetchContent) {
      return this.storedFileRepository.findAll().stream()
          .map(
              file ->
                  StoredFileDTO.fromStoredFile(
                      file, this.fileManager.getFile(file.getResourcePath())))
          .toList();
    } else {
      return this.storedFileRepository.findAll().stream()
          .map(file -> StoredFileDTO.fromStoredFile(file, null))
          .toList();
    }
  }

  @Transactional(readOnly = true)
  public StoredFileDTO getFileById(Long id) {
    StoredFile storedFile =
        this.storedFileRepository
            .findById(Objects.requireNonNull(id, "getFileById - id must not be null"))
            .orElse(null);
    return StoredFileDTO.fromStoredFile(
        storedFile, this.fileManager.getFile(storedFile.getResourcePath()));
  }

  @Transactional(readOnly = true)
  public List<StoredFileDTO> getStoredFilesByOwnerId(Long id, boolean fetchContent) {
    if (fetchContent) {
      return this.storedFileRepository.findAll().stream()
          .map(
              file ->
                  StoredFileDTO.fromStoredFile(
                      file, this.fileManager.getFile(file.getResourcePath())))
          .filter(storedFile -> storedFile.ownerId().equals(id))
          .toList();
    } else {
      return this.storedFileRepository.findAll().stream()
          .map(file -> StoredFileDTO.fromStoredFile(file, null))
          .filter(storedFile -> storedFile.ownerId().equals(id))
          .toList();
    }
  }

  // File content

  @Transactional(readOnly = true)
  public byte[] getFileContentById(Long id) {
    StoredFile storedFile =
        this.storedFileRepository
            .findById(Objects.requireNonNull(id, "exportFileById - id must not be null"))
            .orElse(null);
    return this.fileManager.getFile(storedFile.getResourcePath());
  }

  @Transactional
  public void updateFileContentById(Long id, byte[] newContent) {
    StoredFile storedFile =
        this.storedFileRepository
            .findById(Objects.requireNonNull(id, "updateFileContent - id must not be null"))
            .orElseThrow(() -> new IllegalArgumentException("File not found: " + id));

    String format = storedFile.getFormat().getFormat();

    String newPath = this.fileManager.saveFile(newContent, format, this.getAllStoredFilePaths());
    storedFile.setResourcePath(newPath);

    this.storedFileRepository.save(storedFile);
  }

  // Conversion

  @Transactional(readOnly = true)
  public byte[] convertDocxToPdfById(@NonNull Long id) throws Exception {
    StoredFileDTO fileDto = this.getFileById(id);

    Format format =
        this.formatRepository
            .findById(
                Objects.requireNonNull(
                    fileDto.formatId(),
                    "convertDocxToPdfById - fileDto.formatId() must not be null"))
            .orElseThrow(
                () ->
                    new IllegalArgumentException("Unknown file format id: " + fileDto.formatId()));

    if (!"application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        .equals(format.getMimeType())) {
      throw new IllegalArgumentException("File format is not supported for PDF export");
    }

    StoredFile storedFile =
        this.storedFileRepository
            .findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Stored file not found: " + id));

    byte[] docxBytes = this.fileManager.getFile(storedFile.getResourcePath());

    byte[] outputPdfBytes = FormatConverter.convertDocxToPdfBytesUsingLibreOffice(docxBytes);

    return outputPdfBytes;
  }

  @Transactional(readOnly = true)
  public String convertDocxToSfdtById(Long id) throws Exception {
    byte[] docxBytes = this.getFileContentById(id);
    InputStream is = new ByteArrayInputStream(docxBytes);
    return WordProcessorHelper.load(is, FormatType.Docx);
  }

  @Transactional(readOnly = true)
  public byte[] convertSfdtToDocxById(Long id, String sfdt) throws Exception {
    OutputStream os = WordProcessorHelper.save(sfdt, FormatType.Docx);
    byte[] docxBytes = ((ByteArrayOutputStream) os).toByteArray();
    return docxBytes;
  }

  // Post, Delete

  @Transactional
  public StoredFileDTO saveStoredFile(
      @NonNull HttpServletRequest request, @NonNull StoredFileDTO dto, boolean sendToOCR) {

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
      path = fileManager.saveFile(dto.content(), format.getFormat(), this.getAllStoredFilePaths());
    } catch (Exception e) {
      throw new RuntimeException("Failed to save file content", e);
    }

    StoredFile storedFile = StoredFileDTO.toStoredFile(dto, owner, format, primary, path);
    storedFile =
        java.util.Objects.requireNonNull(
            storedFile, "StoredFileDTO.toStoredFile returned null for dto=" + dto);
    StoredFile savedFile = storedFileRepository.save(storedFile);
    if (sendToOCR) {
      this.sendFileToOCRService(dto, request.getHeader(HttpHeaders.AUTHORIZATION));
    }

    return StoredFileDTO.fromStoredFile(savedFile, dto.content());
  }

  @Transactional
  public void deleteStoredFileById(Long id) {
    this.storedFileRepository.deleteById(
        Objects.requireNonNull(id, "deleteStoredFileById - id must not be null"));
  }

  // Helpers

  public void sendFileToOCRService(@NonNull StoredFileDTO storedFileDTO, String authHeader) {
    try {
      this.webClient
          .post()
          .uri(
              Objects.requireNonNull(
                  this.ocrPath,
                  "sendFileToOCRService - this.ocrPath must not be null. Check resources"))
          .header(HttpHeaders.AUTHORIZATION, authHeader)
          .contentType(
              MediaType
                  .APPLICATION_JSON) // This warning makes no sense, MediaType.APPLICATION_JSON cant
          // be null
          .bodyValue(storedFileDTO)
          .retrieve()
          .bodyToMono(Void.class)
          .subscribe(
              v -> {},
              e -> {
                System.out.println("OCR error: " + e.getMessage());
              });
    } catch (Exception e) {
      System.out.println(e.getMessage());
    }
  }

  public Set<String> getAllStoredFilePaths() {
    return new HashSet<>(
        this.getAllStoredFiles(false).stream()
            .map(
                dto -> {
                  String path = dto.resourcePath();
                  if (path == null || path.isBlank()) return null;
                  return path.split("\\.")[0];
                })
            .filter(java.util.Objects::nonNull)
            .toList());
  }
}
