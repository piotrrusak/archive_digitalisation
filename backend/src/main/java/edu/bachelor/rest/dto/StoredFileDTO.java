package edu.bachelor.dto;

import edu.bachelor.rest.model.Format;
import edu.bachelor.rest.model.StoredFile;
import edu.bachelor.rest.model.User;

public record StoredFileDTO (
    Long ownerId,
    Long formatId,
    Integer generation,
    Long primaryFileId,
    byte[] content
) {

    public static StoredFileDTO fromStoredFile(StoredFile storedFile, byte[] content) {

        return new StoredFileDTO(
            storedFile.getOwner().getId(),
            storedFile.getFormat().getId(),
            storedFile.getGeneration(),
            storedFile.getPrimaryFile().getId(),
            content
        );
        
    }

    public static StoredFile toStoredFile(StoredFileDTO storedFileDTO, User owner, Format format, StoredFile primary, String resourcePath) {
        
        return StoredFile.builder()
            .owner(owner)
            .format(format)
            .generation(storedFileDTO.generation())
            .primaryFile(primary)
            .resourcePath(resourcePath)
            .build();

    }

}