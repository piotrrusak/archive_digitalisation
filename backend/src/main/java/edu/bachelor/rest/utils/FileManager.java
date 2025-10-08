package edu.bachelor.rest.utils;

public interface FileManager {

  public String saveFile(byte[] data);

  public byte[] getFile(String key);
}
