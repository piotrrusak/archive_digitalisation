package edu.bachelor.rest.controller;

import edu.bachelor.dto.StoredFileDTO;
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
    public List<StoredFileDTO> getAllStoredFiles() {
        return this.storedFileService.getAllStoredFiles();
    }

    @GetMapping("/{id}")
    public StoredFileDTO getStoredFileById(@PathVariable Long id) throws Exception {
        return this.storedFileService.getFileById(id);
    }

    @GetMapping("/owner/{owner_id}")
    public List<StoredFileDTO> getStoredFileByOwnerId(@PathVariable Long owner_id) {
        return this.storedFileService.getStoredFilesByOwnerId(owner_id);
    }

    @PostMapping
    public StoredFile saveStoredFile(@RequestBody StoredFileDTO storedFileDTO) {
        return this.storedFileService.saveStoredFile(storedFileDTO);
    }

    @DeleteMapping("/{id}")
    public void deleteStoredFileById(@PathVariable Long id) {
        this.storedFileService.deleteStoredFileById(id);
    }


}
