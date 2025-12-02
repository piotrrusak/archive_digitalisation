package edu.bachelor.rest.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

public class ExternalAuthFilter extends OncePerRequestFilter {

  private final AuthClient authClient;

  public ExternalAuthFilter(AuthClient authClient) {
    this.authClient = authClient;
  }

  @Override
  protected void doFilterInternal(
      @NonNull HttpServletRequest request,
      @NonNull HttpServletResponse response,
      @NonNull FilterChain filterChain)
      throws ServletException, IOException {

    if (isPreflight(request)) {
      filterChain.doFilter(request, response);
      return;
    }

    if (SecurityContextHolder.getContext().getAuthentication() == null) {
      String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);

      if (authHeader == null) {
        unauthorized(response, "Missing or invalid Authorization header");
        return;
      }

      AuthVerifyResponse verify = authClient.verify(authHeader);
      if (verify != null && verify.valid()) {
        var principal = new ExternalUser(verify.user_id(), verify.email());
        var auth = new ExternalAuthenticationToken(principal, authHeader, List.of());

        SecurityContextHolder.getContext().setAuthentication(auth);
      } else {
        unauthorized(response, "Token not valid");
        return;
      }
    }

    filterChain.doFilter(request, response);
  }

  private boolean isPreflight(HttpServletRequest request) {
    return "OPTIONS".equalsIgnoreCase(request.getMethod())
        && request.getHeader("Origin") != null
        && request.getHeader("Access-Control-Request-Method") != null;
  }

  private void unauthorized(HttpServletResponse response, String msg) throws IOException {
    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
    response.setContentType("application/json");
    response
        .getWriter()
        .write(
            """
            {"error":"%s"}
            """
                .formatted(msg));
  }

  public record ExternalUser(String userId, String email) {}

  static class ExternalAuthenticationToken extends AbstractAuthenticationToken {
    private final ExternalUser principal;
    private final String credentials;

    public ExternalAuthenticationToken(
        ExternalUser principal, String credentials, List<SimpleGrantedAuthority> authorities) {
      super(authorities);
      this.principal = principal;
      this.credentials = credentials;
      setAuthenticated(true);
    }

    @Override
    public Object getCredentials() {
      return credentials;
    }

    @Override
    public Object getPrincipal() {
      return principal;
    }
  }
}
