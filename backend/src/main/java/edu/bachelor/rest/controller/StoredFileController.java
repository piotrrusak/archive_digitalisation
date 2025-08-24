package edu.bachelor.rest.controller;

import edu.bachelor.rest.model.StoredFile;
import edu.bachelor.rest.service.StoredFileService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/stored_files")
public class StoredFileController {

    private final StoredFileService storedFileService;

    @GetMapping
    public List<StoredFile> getAllStoredFiles() {
        return this.storedFileService.getAllStoredFiles();
    }

    @GetMapping("/{id}")
    public StoredFile getStoredFileById(@PathVariable Long id) throws Exception {
        return this.storedFileService.getFileById(id).orElseThrow(() -> new Exception(""));
    }

    @GetMapping("/owner/{owner_id}")
    public List<StoredFile> getStoredFileByOwnerId(@PathVariable Long owner_id) {
        return this.storedFileService.getStoredFilesByOwnerId(owner_id);
    }

    @PostMapping
    public StoredFile saveStoredFile(@RequestBody StoredFile storedFile) {
        return this.storedFileService.saveStoredFile(storedFile);
    }

    @DeleteMapping("/{id}")
    public void deleteStoredFileById(@PathVariable Long id) {
        this.storedFileService.deleteStoredFileById(id);
    }


}
