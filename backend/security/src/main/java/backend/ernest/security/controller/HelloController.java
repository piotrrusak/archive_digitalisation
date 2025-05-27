package backend.ernest.security.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {

    @GetMapping("/hello")
    public String hello(@AuthenticationPrincipal Jwt jwt) {
        return "Hello, " + jwt.getClaimAsString("preferred_username");
    }

    @GetMapping("/public/info")
    public String info() {
        return "Public info";
    }
}
