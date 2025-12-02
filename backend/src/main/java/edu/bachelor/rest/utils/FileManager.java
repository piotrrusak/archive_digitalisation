package edu.bachelor.rest.utils;

import java.util.Set;

public interface FileManager {

  public String saveFile(byte[] data, String format, Set<String> takenPaths);

  public byte[] getFile(String key);
}
