package edu.bachelor.rest.utils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import org.springframework.stereotype.Component;

@Component
public class FileManager {

  private final PathGenerator pathGenerator;

  private static final Path BASE_DIR = Path.of(System.getProperty("user.dir"), "files");

  public FileManager() {
    this.pathGenerator = new PathGenerator();
  }

  public String save_file(byte[] data) throws IOException {

    if (!Files.exists(BASE_DIR)) {
      Files.createDirectories(BASE_DIR);
    }

    Path path = BASE_DIR.resolve(this.pathGenerator.generateRandomPath());
    Files.write(path, data);

    return path.toAbsolutePath().toString();
  }

  public byte[] get_file(String local_path) {
    Path path = Paths.get(local_path);
    byte[] file_bytes = null;
    try {
      file_bytes = Files.readAllBytes(path);
    } catch (IOException e) {
      e.printStackTrace();
    }
    return file_bytes;
  }
}
