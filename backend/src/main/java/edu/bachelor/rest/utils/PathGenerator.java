package edu.bachelor.rest.utils;

import java.util.Set;
import java.util.UUID;

public class PathGenerator {

  public static String generateRandomPath(Set<String> takenPaths) {
    String temp = UUID.randomUUID().toString();
    while (takenPaths != null && takenPaths.contains(temp)) {
      continue;
    }
    return temp;
  }
}
