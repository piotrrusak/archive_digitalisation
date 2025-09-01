package edu.bachelor.rest.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(
        name = "files",
        indexes = {
                @Index(name = "idx_files_owner", columnList = "owner_id"),
                @Index(name = "idx_files_format", columnList = "format_id"),
                @Index(name = "idx_files_primary", columnList = "primary_file_id")
        },
        uniqueConstraints = @UniqueConstraint(
                name = "uk_files_owner_path",
                columnNames = {"owner_id", "resource_path"}
        )
)
public class StoredFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(nullable = false)
    private String resourcePath;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "format_id", nullable = false)
    private Format format;

    private Integer generation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "primary_file_id")
    private StoredFile primaryFile;
}