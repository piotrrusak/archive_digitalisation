package edu.bachelor.rest.utils;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

class FileManagerTest {

    private final FileManager fileManager = new FileManager();
    private Path lastCreatedPath;

    @AfterEach
    void cleanup() throws IOException {
        if (lastCreatedPath != null && Files.exists(lastCreatedPath)) {
            Files.delete(lastCreatedPath);
        }
        lastCreatedPath = null;
    }

    @Test
    void saveFile_writesBytesAndReturnsAbsolutePath() throws IOException {
        byte[] data = "hello world".getBytes();

        String absolutePathStr = fileManager.save_file(data);
        Path absolutePath = Path.of(absolutePathStr);
        lastCreatedPath = absolutePath;

        assertTrue(absolutePath.isAbsolute(), "Return path should be absolute path");
        assertTrue(Files.exists(absolutePath), "File do not exist");
        assertEquals("output.txt", absolutePath.getFileName().toString(), "Filename is incorrect");

        byte[] onDisk = Files.readAllBytes(absolutePath);
        assertArrayEquals(data, onDisk, "Output bytes differs from input bytes");
    }

    @Test
    void getFile_readsSameBytesAsSaved() throws IOException {
        byte[] data = new byte[]{1, 2, 3, 4, 5};

        String path = fileManager.save_file(data);
        lastCreatedPath = Path.of(path);

        byte[] read = fileManager.get_file(path);
        assertArrayEquals(data, read, "Output bytes differs from input bytes");
    }

    @Test
    void getFile_throwsWhenFileDoesNotExist() {
        String nonExisting = Path.of("definitely-not-existing-123456789.bin").toAbsolutePath().toString();

        assertThrows(IOException.class, () -> fileManager.get_file(nonExisting),
                "Should throw IOException");
    }

    @Test
    void saveFile_overwritesExistingFile() throws IOException {
        byte[] first = "first".getBytes();
        byte[] second = "second".getBytes();

        String path1 = fileManager.save_file(first);
        lastCreatedPath = Path.of(path1);
        assertTrue(Files.exists(lastCreatedPath));

        String path2 = fileManager.save_file(second);
        assertEquals(path1, path2, "Save always to same path");

        byte[] read = Files.readAllBytes(lastCreatedPath);
        assertTrue(Arrays.equals(second, read), "The second function call should overwrite the file");
    }
}
