package edu.bachelor.rest.service;

import edu.bachelor.rest.dto.StoredFileDTO;
import edu.bachelor.rest.model.Format;
import edu.bachelor.rest.model.StoredFile;
import edu.bachelor.rest.model.User;
import edu.bachelor.rest.repository.FormatRepository;
import edu.bachelor.rest.repository.StoredFileRepository;
import edu.bachelor.rest.repository.UserRepository;
import edu.bachelor.rest.utils.FileManager;
import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class StoredFileService {

    private final StoredFileRepository storedFileRepository;
    private final UserRepository userRepository;
    private final FormatRepository formatRepository;
    private final FileManager fileManager;

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

    public StoredFile saveStoredFile(StoredFileDTO dto) {
        User owner = userRepository.findById(dto.getOwnerId())
                .orElseThrow(() -> new IllegalArgumentException("Owner not found: " + dto.getOwnerId()));

        Format format = formatRepository.findById(dto.getFormatId())
                .orElseThrow(() -> new IllegalArgumentException("Format not found: " + dto.getFormatId()));

        StoredFile primary = null;
        if (dto.getPrimaryFileId() != null) {
            primary = storedFileRepository.findById(dto.getPrimaryFileId())
                    .orElseThrow(() -> new IllegalArgumentException("Primary file not found: " + dto.getPrimaryFileId()));
        }


        final String path;
        try {
            path = fileManager.save_file(dto.getContent());
        } catch (IOException e) {
            throw new RuntimeException("Failed to save file content", e);
        }

        StoredFile entity = new StoredFile();
        entity.setOwner(owner);
        entity.setFormat(format);
        entity.setGeneration(dto.getGeneration());
        entity.setPrimaryFile(primary);
        entity.setResourcePath(path);

        return storedFileRepository.save(entity);
    }

    public void deleteStoredFileById(Long id) {
        this.storedFileRepository.deleteById(id);
    }

}
