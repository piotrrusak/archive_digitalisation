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
        while(this.paths.contains(temp)) {
            continue;
        }
        this.paths.add(temp);
        return temp;
    }
    return temp;
  }
}
