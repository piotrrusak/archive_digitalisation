package edu.bachelor.rest.controller;

import edu.bachelor.rest.dto.StoredFileDTO;
import edu.bachelor.rest.repository.FormatRepository;
import edu.bachelor.rest.service.StoredFileService;
import edu.bachelor.rest.utils.PathGenerator;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/stored_files")
public class StoredFileController {

  private final StoredFileService storedFileService;
  private final FormatRepository formatRepository;

  @GetMapping
  public List<StoredFileDTO> getAllStoredFiles(
      @RequestParam(name = "fetchContent", defaultValue = "false") boolean fetch_content) {
    return this.storedFileService.getAllStoredFiles(fetch_content);
  }

  @GetMapping("/{id}")
  public StoredFileDTO getStoredFileById(@PathVariable Long id) throws Exception {
    return this.storedFileService.getFileById(id);
  }

  @GetMapping("/{id}/export")
  public byte[] exportStoredFileById(@PathVariable Long id) throws Exception {
    return this.storedFileService.getFileContentById(id);
  }

  @GetMapping("/{id}/convert/docx_to_pdf")
  public StoredFileDTO convertDocxToPdfById(
      @NonNull HttpServletRequest request, @NonNull @PathVariable Long id) throws Exception {

    StoredFileDTO original = this.storedFileService.getFileById(id);

    StoredFileDTO temp =
        new StoredFileDTO(
            original.id(),
            original.ownerId(),
            this.formatRepository.findByFormat("pdf").getId(),
            PathGenerator.generateRandomPath(null) + ".pdf",
            original.generation() + 1,
            original.primaryFileId(),
            this.storedFileService.convertDocxToPdfById(id),
            original.processingModelId());

    return this.storedFileService.saveStoredFile(request, temp, "0");
  }

  @GetMapping("/{id}/preview")
  public ResponseEntity<byte[]> previewStoredFileById(@PathVariable Long id) throws Exception {
    byte[] pdf = storedFileService.getFileContentById(id);

    return ResponseEntity.ok()
        .header("Content-Type", "application/pdf")
        .header("Content-Disposition", "inline; filename=\"preview.pdf\"")
        .body(pdf);
  }

  @GetMapping("/owner/{owner_id}")
  public List<StoredFileDTO> getStoredFileByOwnerId(
      @PathVariable Long owner_id,
      @RequestParam(name = "fetchContent", defaultValue = "0") boolean fetch_content) {
    return this.storedFileService.getStoredFilesByOwnerId(owner_id, fetch_content);
  }

  @PostMapping
  public StoredFileDTO saveStoredFile(
      @NonNull HttpServletRequest request,
      @NonNull @RequestBody StoredFileDTO storedFileDTO,
      @RequestParam(name = "sendToOCR", defaultValue = "0") String sendToOCR)
      throws Exception {

    return this.storedFileService.saveStoredFile(request, storedFileDTO, sendToOCR);
  }

  @DeleteMapping("/{id}")
  public void deleteStoredFileById(@PathVariable Long id) {
    this.storedFileService.deleteStoredFileById(id);
  }

  @GetMapping(value = "/{id}/convert/docx_to_sfdt", produces = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<String> exportStoredFileAsSfdt(@PathVariable Long id) {
    try {
      String sfdt = this.storedFileService.convertDocxToSfdtById(id);
      if (sfdt == null || sfdt.isBlank()) {
        return ResponseEntity.notFound().build();
      }
      return ResponseEntity.ok(sfdt);
    } catch (Exception e) {
      return ResponseEntity.internalServerError().build();
    }
  }

  @PutMapping(value = "/{id}/update/sfdt", consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<Void> updateStoredFileContent(
      @PathVariable Long id, @RequestBody String sfdt) {
    try {
      byte[] bytes = this.storedFileService.convertSfdtToDocxById(id, sfdt);
      this.storedFileService.updateFileContentById(id, bytes);
      return ResponseEntity.noContent().build();
    } catch (Exception e) {
      return ResponseEntity.internalServerError().build();
    }
  }
}
