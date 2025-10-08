package edu.bachelor.rest.utils;

import java.io.IOException;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Service
@Getter
@Setter
@RequiredArgsConstructor
public class AWSFileManager implements FileManager {

  private final S3Client s3;

  @Value("${aws.bucket-name}")
  private String bucketName;

  private PathGenerator pathGenerator = new PathGenerator();

  @Override
  public String saveFile(byte[] data) {
    String key = this.pathGenerator.generateRandomPath();

    s3.putObject(
        PutObjectRequest.builder().bucket(bucketName).key(key).contentType("text/plain").build(),
        RequestBody.fromBytes(data));
    System.out.println("File sent S3 as: " + key);

    return key;
  }

  @Override
  public byte[] getFile(String key) {

    byte[] bytes = null;

    var file = s3.getObject(GetObjectRequest.builder().bucket(bucketName).key(key).build());
    try {
      bytes = file.readAllBytes();
    } catch (IOException e) {
      e.printStackTrace();
    }

    return bytes;
  }
}
