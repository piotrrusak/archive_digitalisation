package edu.bachelor.rest.dto;

import edu.bachelor.rest.model.Format;
import edu.bachelor.rest.model.StoredFile;
import edu.bachelor.rest.model.User;

public record StoredFileDTO(
    Long ownerId, Long formatId, Integer generation, Long primaryFileId, byte[] content) {

  public static StoredFileDTO fromStoredFile(StoredFile storedFile, byte[] content) {
    StoredFile primary = storedFile.getPrimaryFile();
    Long temp = null;
    if (primary != null) {
      temp = primary.getId();
    }

    return new StoredFileDTO(
        storedFile.getOwner().getId(),
        storedFile.getFormat().getId(),
        storedFile.getGeneration(),
        temp,
        content);
  }

  public static StoredFile toStoredFile(
      StoredFileDTO storedFileDTO,
      User owner,
      Format format,
      StoredFile primary,
      String resourcePath) {

    return StoredFile.builder()
        .owner(owner)
        .format(format)
        .generation(storedFileDTO.generation())
        .primaryFile(primary)
        .resourcePath(resourcePath)
        .build();
  }
}
