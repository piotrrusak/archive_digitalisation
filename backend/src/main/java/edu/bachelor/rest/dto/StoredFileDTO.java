package edu.bachelor.rest.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StoredFileDTO {

    private Long ownerId;
    private Long formatId;
    private Integer generation;
    private Long primaryFileId;

    private byte[] content;
}
