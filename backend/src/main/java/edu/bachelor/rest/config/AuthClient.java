package edu.bachelor.rest.config;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class AuthClient {
  private final RestClient restClient;
  private final AuthProps props;

  public AuthClient(@NonNull AuthProps props) {
    this.props = props;

    var factory = new SimpleClientHttpRequestFactory();
    factory.setConnectTimeout(props.getConnectTimeoutMs());
    factory.setReadTimeout(props.getReadTimeoutMs());

    String baseUrl = props.getBaseUrl();
    if (baseUrl == null) {
      baseUrl = "";
    }

    this.restClient = RestClient.builder().baseUrl(baseUrl).requestFactory(factory).build();
  }

  public AuthVerifyResponse verify(String authorizationHeader) {
    try {
      if (props.getBypassToken().equals(authorizationHeader)) {
        return new AuthVerifyResponse(true, null, null);
      }
      String path = props.getPath();
      if (path == null) {
        path = "";
      }
      return restClient
          .get()
          .uri(path)
          .header(HttpHeaders.AUTHORIZATION, authorizationHeader)
          .accept(MediaType.APPLICATION_JSON)
          .retrieve()
          .body(AuthVerifyResponse.class);
    } catch (Exception e) {
      return new AuthVerifyResponse(false, null, null);
    }
  }
}
