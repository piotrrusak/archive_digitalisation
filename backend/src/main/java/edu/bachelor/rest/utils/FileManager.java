package edu.bachelor.rest.utils;

public interface FileManager {

  public String saveFile(byte[] data, String format);

  public byte[] getFile(String key);
}
