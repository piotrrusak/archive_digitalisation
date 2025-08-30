package edu.bachelor.rest.utils;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class PathGenerator {

    private List<String> paths;

    public PathGenerator() {
        this.paths = new ArrayList<>();
    }

    public String generateRandomPath() {
        String temp = UUID.randomUUID().toString();
        while(this.paths.contains(temp)) {
            continue;
        }
        return temp;
    }
    
}
