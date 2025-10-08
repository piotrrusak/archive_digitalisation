package edu.bachelor.rest.utils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.stereotype.Component;

@Component
public class LocalFileManager {

    private final PathGenerator pathGenerator;

    private static final Path BASE_DIR = Path.of("/app/files");

    public LocalFileManager() {
        this.pathGenerator = new PathGenerator();
    }

    public String saveFile(byte[] data) throws IOException {

        if (!Files.exists(BASE_DIR)) {
            Files.createDirectories(BASE_DIR);
        }

        Path path = BASE_DIR.resolve(this.pathGenerator.generateRandomPath());
        Files.write(path, data);

        return path.toAbsolutePath().toString();
    }

    public byte[] getFile(String key) {
        Path path = Paths.get(key);
        byte[] file_bytes = null;
        try {
            file_bytes = Files.readAllBytes(path);
        } catch (IOException e) {
            e.printStackTrace();
        }
        return file_bytes;
    }
}
