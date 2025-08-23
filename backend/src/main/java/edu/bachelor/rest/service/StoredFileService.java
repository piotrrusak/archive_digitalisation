package edu.bachelor.rest.service;

import edu.bachelor.rest.model.StoredFile;
import edu.bachelor.rest.repository.StoredFileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class StoredFileService {

    private final StoredFileRepository storedFileRepository;

    @Transactional(readOnly = true)
    public List<StoredFile> getAllStoredFiles() {
        return this.storedFileRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<StoredFile> getFileById(Long id) {
        return this.storedFileRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<StoredFile> getStoredFilesByOwnerId(Long id) {
        return this.storedFileRepository.findAll().stream()
                .filter(storedFile -> storedFile.getOwner().getId().equals(id))
                .toList();
    }

    public StoredFile saveStoredFile(StoredFile storedFile) {
        return this.storedFileRepository.save(storedFile);
    }

    public void deleteStoredFileById(Long id) {
        this.storedFileRepository.deleteById(id);
    }

}
