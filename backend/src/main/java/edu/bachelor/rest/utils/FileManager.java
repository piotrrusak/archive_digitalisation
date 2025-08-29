package edu.bachelor.rest.utils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.stereotype.Component;

@Component
public class FileManager {

    private PathGenerator pathGenerator;

    public FileManager() {
        this.pathGenerator = new PathGenerator();
    }

    public String save_file(byte[] data) throws IOException {
        Path path = Path.of("/files/" + this.pathGenerator.generateRandomPath());
        Files.write(path, data);
        return path.toAbsolutePath().toString();
    }

    public byte[] get_file(String local_path) throws IOException {
        Path path = Paths.get(local_path);
        return Files.readAllBytes(path);
    }

}
