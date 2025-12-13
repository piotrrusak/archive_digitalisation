package edu.bachelor.rest.utils;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;

public class ResponseEntityCreator {

  public static ResponseEntity<String> createResponseEntity(
      Integer status, @NonNull MediaType contentType, String body) {
    return ResponseEntity.status(status).contentType(contentType).body(body);
  }
}
