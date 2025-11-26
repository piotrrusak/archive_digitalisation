package edu.bachelor.rest.controller;

import com.syncfusion.ej2.wordprocessor.FormatType;
import com.syncfusion.ej2.wordprocessor.WordProcessorHelper;
import edu.bachelor.rest.dto.StoredFileDTO;
import edu.bachelor.rest.model.StoredFile;
import edu.bachelor.rest.service.StoredFileService;
import jakarta.servlet.http.HttpServletRequest;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/stored_files")
public class StoredFileController {

  private final StoredFileService storedFileService;

  @GetMapping
  public List<StoredFileDTO> getAllStoredFiles() {
    return this.storedFileService.getAllStoredFiles();
  }

  @GetMapping("/{id}")
  public StoredFileDTO getStoredFileById(@PathVariable Long id) throws Exception {
    return this.storedFileService.getFileById(id);
  }

  @GetMapping("/{id}/export")
  public byte[] exportStoredFileById(@PathVariable Long id) throws Exception {
    return this.storedFileService.exportFileById(id);
  }

  @GetMapping("/owner/{owner_id}")
  public List<StoredFileDTO> getStoredFileByOwnerId(@PathVariable Long owner_id) {
    return this.storedFileService.getStoredFilesByOwnerId(owner_id);
  }

  @PostMapping
  public StoredFile saveStoredFile(
      HttpServletRequest request, @RequestBody StoredFileDTO storedFileDTO) {
    return this.storedFileService.saveStoredFile(request, storedFileDTO);
  }

  @DeleteMapping("/{id}")
  public void deleteStoredFileById(@PathVariable Long id) {
    this.storedFileService.deleteStoredFileById(id);
  }

  // ===========================
  //  NOWY ENDPOINT: DOCX -> SFDT
  // ===========================

  /**
   * Zwraca dokument w formacie SFDT dla Syncfusion DocumentEditor.
   *
   * <p>Front: GET /api/v1/stored_files/{id}/syncfusion i potem: documentEditor.open(sfdtString)
   */
  @GetMapping(value = "/{id}/syncfusion", produces = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<String> exportStoredFileAsSfdt(@PathVariable Long id) {
    // 1. Pobierz bajty pliku (DOCX) z istniejącego serwisu
    byte[] docxBytes = this.storedFileService.exportFileById(id);

    if (docxBytes == null || docxBytes.length == 0) {
      return ResponseEntity.notFound().build();
    }

    try (InputStream is = new ByteArrayInputStream(docxBytes)) {
      // 2. Konwersja DOCX -> SFDT
      String sfdt = WordProcessorHelper.load(is, FormatType.Docx);

      // 3. Zwracamy czysty SFDT jako JSON string
      return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(sfdt);

    } catch (Exception e) {
      e.printStackTrace();

      String errorText = "Błąd konwersji dokumentu: " + e.getMessage();
      String errorSfdt =
          "{\"sections\":[{\"blocks\":[{\"inlines\":[{\"text\":\""
              + escapeForJson(errorText)
              + "\"}]}]}]}";

      return ResponseEntity.status(500).contentType(MediaType.APPLICATION_JSON).body(errorSfdt);
    }
  }

  // helper do escapowania stringa do JSON-a
  private String escapeForJson(String value) {
    if (value == null) {
      return "";
    }
    return value
        .replace("\\", "\\\\")
        .replace("\"", "\\\"")
        .replace("\n", "\\n")
        .replace("\r", "\\r");
  }

  @PutMapping(
    value = "/{id}/syncfusion",
    consumes = MediaType.APPLICATION_JSON_VALUE
  )
  public ResponseEntity<Void> saveEditedDocument(
      @PathVariable Long id,
      @RequestBody String sfdt
  ) {
    try {
      // 1. Konwersja SFDT -> DOCX
      OutputStream os = WordProcessorHelper.save(sfdt, FormatType.Docx);

      // zakładamy, że Syncfusion używa ByteArrayOutputStream
      byte[] docxBytes = ((ByteArrayOutputStream) os).toByteArray();

      // 2. Zapis pliku w storage (S3 / dysk) pod tym samym StoredFile
      storedFileService.updateFileContent(id, docxBytes);

      return ResponseEntity.noContent().build();
    } catch (Exception e) {
      e.printStackTrace();
      return ResponseEntity.internalServerError().build();
    }
  }
}
