package edu.bachelor.rest.config;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class AuthClient {
  private final RestClient restClient;
  private final AuthProps props;

  public AuthClient(AuthProps props) {
    this.props = props;

    var factory = new SimpleClientHttpRequestFactory();
    factory.setConnectTimeout(props.getConnectTimeoutMs());
    factory.setReadTimeout(props.getReadTimeoutMs());

    this.restClient =
        RestClient.builder().baseUrl(props.getBaseUrl()).requestFactory(factory).build();
  }

  public AuthVerifyResponse verify(String authorizationHeader) {
    try {
      if (props.getBypassToken().equals(authorizationHeader)) {
        return new AuthVerifyResponse(true, null, null);
      }
      return restClient
          .get()
          .uri(props.getPath())
          .header(HttpHeaders.AUTHORIZATION, authorizationHeader)
          .accept(MediaType.APPLICATION_JSON)
          .retrieve()
          .body(AuthVerifyResponse.class);
    } catch (Exception e) {
      return new AuthVerifyResponse(false, null, null);
    }
  }
}
