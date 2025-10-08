package edu.bachelor.rest.utils;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

public class PathGenerator {

  private Set<String> paths;

  public PathGenerator() {
    this.paths = new HashSet<>();
  }

  public String generateRandomPath() {
    String temp = UUID.randomUUID().toString();
    while (this.paths.contains(temp)) {
      continue;
    }
<<<<<<< HEAD
    this.paths.add(temp);
=======
>>>>>>> 48607e5bd63efc4010db4c93fe5c0ad81059bfce
    return temp;
  }
}
