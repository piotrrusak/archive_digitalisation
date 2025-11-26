package edu.bachelor.rest.service;

import edu.bachelor.rest.dto.StoredFileDTO;
import edu.bachelor.rest.model.Format;
import edu.bachelor.rest.model.StoredFile;
import edu.bachelor.rest.model.User;
import edu.bachelor.rest.repository.FormatRepository;
import edu.bachelor.rest.repository.StoredFileRepository;
import edu.bachelor.rest.repository.UserRepository;
import edu.bachelor.rest.utils.AWSFileManager;
import fr.opensagres.poi.xwpf.converter.pdf.PdfConverter;
import fr.opensagres.poi.xwpf.converter.pdf.PdfOptions;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.math.BigInteger;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;

import lombok.RequiredArgsConstructor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
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
  public byte[] exportStoredFileAsPdfById(Long id) throws Exception {
      // 1. Pobieramy DTO pliku
      StoredFileDTO fileDto = this.getFileById(id);

      // 2. Pobieramy Format po formatId z DTO
      Format format = this.formatRepository.findById(fileDto.formatId())
          .orElseThrow(() -> new IllegalArgumentException(
              "Unknown file format id: " + fileDto.formatId()
          ));

      // 3. Sprawdzamy MIME type – tylko DOCX
      if (!"application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              .equals(format.getMimeType())) {
          throw new IllegalArgumentException("File format is not supported for PDF export");
      }

      // 4. Pobieramy StoredFile (z resourcePath)
      StoredFile storedFile = this.storedFileRepository.findById(id)
          .orElseThrow(() -> new IllegalArgumentException(
              "Stored file not found: " + id
          ));

      // 5. Wczytujemy bajty DOCX
      byte[] docxBytes = this.fileManager.getFile(storedFile.getResourcePath());

      // 6. Konwersja DOCX -> PDF (tu możesz podstawić swoją wersję z LibreOffice)
      byte[] outputPdfBytes = convertDocxToPdfBytesUsingLibreOffice(docxBytes);
      // lub:
      // byte[] outputPdfBytes = convertDocxToPdfBytesUsingLibreOffice(docxBytes);

      return outputPdfBytes;
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

  public StoredFileDTO saveStoredFileWithoutOCR(StoredFileDTO dto) {

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
      path = fileManager.saveFile(dto.content(), format.getFormat());
    } catch (Exception e) {
      throw new RuntimeException("Failed to save file content", e);
    }

    StoredFile storedFile = StoredFileDTO.toStoredFile(dto, owner, format, primary, path);
    storedFile =
        java.util.Objects.requireNonNull(
            storedFile, "StoredFileDTO.toStoredFile returned null for dto=" + dto);
    StoredFile savedFile = storedFileRepository.save(storedFile);

    return StoredFileDTO.fromStoredFile(savedFile, dto.content());
  }

  public StoredFileDTO saveStoredFile(HttpServletRequest request, StoredFileDTO dto) {

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
      path = fileManager.saveFile(dto.content(), format.getFormat());
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

      try {
        this.webClient
            .post()
            .uri(this.ocrPath)
            .header(HttpHeaders.AUTHORIZATION, request.getHeader(HttpHeaders.AUTHORIZATION))
            .contentType(json)
            .bodyValue(StoredFileDTO.fromStoredFile(savedFile, dto.content()))
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

    return StoredFileDTO.fromStoredFile(savedFile, dto.content());
  }

  public void deleteStoredFileById(Long id) {
    this.storedFileRepository.deleteById(id);
  }

  @Transactional
  public void updateFileContent(Long id, byte[] newContent) {
    StoredFile storedFile =
        this.storedFileRepository
            .findById(id)
            .orElseThrow(() -> new IllegalArgumentException("File not found: " + id));

    String format = storedFile.getFormat().getFormat();

    String newPath = this.fileManager.saveFile(newContent, format);
    storedFile.setResourcePath(newPath);

    this.storedFileRepository.save(storedFile);
  }

  public byte[] convertDocxToPdfBytesUsingLibreOffice(byte[] docxBytes)
          throws IOException, InterruptedException {

      Path tempDir = Files.createTempDirectory("docx2pdf-");
      Path docxPath = tempDir.resolve(UUID.randomUUID() + ".docx");
      Path pdfPath  = tempDir.resolve(docxPath.getFileName().toString().replace(".docx", ".pdf"));

      Files.write(docxPath, docxBytes);

      ProcessBuilder pb = new ProcessBuilder(
              "soffice",
              "--headless",
              "--nologo",
              "--nofirststartwizard",
              "--convert-to", "pdf",
              "--outdir", tempDir.toAbsolutePath().toString(),
              docxPath.toAbsolutePath().toString()
      );

      pb.redirectErrorStream(true);
      Process process = pb.start();

      // Czytamy output (ważne – libreoffice potrafi się zawiesić bez tego)
      try (BufferedReader reader = new BufferedReader(
              new InputStreamReader(process.getInputStream()))) {
          while (reader.readLine() != null) {
              // można logować
          }
      }

      int exitCode = process.waitFor();
      if (exitCode != 0) {
          throw new RuntimeException("LibreOffice failed with exit code " + exitCode);
      }

      if (!Files.exists(pdfPath)) {
          throw new FileNotFoundException("PDF was not generated by LibreOffice");
      }

      byte[] pdfBytes = Files.readAllBytes(pdfPath);

      // cleanup
      Files.deleteIfExists(docxPath);
      Files.deleteIfExists(pdfPath);
      Files.deleteIfExists(tempDir);

      return pdfBytes;
  }

}
