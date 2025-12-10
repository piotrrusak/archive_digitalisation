package edu.bachelor.rest.controller;

import edu.bachelor.rest.model.User;
import edu.bachelor.rest.service.UserService;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/users")
public class UserController {

  private final UserService userService;

  @GetMapping
  public List<User> getAllUsers() {
    return this.userService.getAllUsers();
  }

  @GetMapping("/{id}")
  public User getById(@NonNull @PathVariable Long id) throws Exception {
    return this.userService.getUserById(id).orElseThrow(() -> new Exception(""));
  }

  @PostMapping
  public User saveUser(@NonNull @RequestBody User user) {
    return this.userService.saveUser(user);
  }

  @PatchMapping("/{id}")
  public User updateUser(@NonNull @PathVariable Long id, @RequestBody Map<String, String> updates)
      throws Exception {
    User user = this.getById(id);
    for (String update : updates.keySet()) {
      switch (update) {
        case "mail":
          user.setMail(updates.get(update));
          break;
        case "username":
          user.setUsername(updates.get(update));
          break;
        case "firstName":
          user.setFirstName(updates.get(update));
          break;
        case "lastName":
          user.setLastName(updates.get(update));
          break;
      }
    }
    return this.userService.saveUser(user); // User cant be null here
  }

  @DeleteMapping("/{id}")
  public void deleteById(@NonNull @PathVariable Long id) {
    this.userService.deleteUser(id);
  }
}
