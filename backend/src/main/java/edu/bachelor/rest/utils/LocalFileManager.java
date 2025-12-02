package edu.bachelor.rest.utils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class LocalFileManager implements FileManager {

  @Value("${storage.local.base-dir-path}")
  public String baseDirPath;

  public String saveFile(byte[] data, String format, Set<String> takenPaths) {

    if (!Files.exists(Path.of(this.baseDirPath))) {
      try {
        Files.createDirectories(Path.of(this.baseDirPath));
      } catch (Exception e) {
        e.printStackTrace();
      }
    }

    Path path =
        Path.of(this.baseDirPath)
            .resolve(PathGenerator.generateRandomPath(takenPaths) + "." + format);
    try {
      Files.write(path, data);
    } catch (Exception e) {
      e.printStackTrace();
    }

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
