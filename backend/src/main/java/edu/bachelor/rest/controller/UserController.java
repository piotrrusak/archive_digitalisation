package edu.bachelor.rest.controller;

import edu.bachelor.rest.model.User;
import edu.bachelor.rest.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
    public User getById(@PathVariable Long id) throws Exception {
        return this.userService.getUserById(id).orElseThrow(() -> new Exception(""));
    }

    @PostMapping
    public User saveUser(@RequestBody User user) {
        return this.userService.saveUser(user);
    }

    @DeleteMapping("/{id}")
    public void deleteById(@PathVariable Long id) {
        this.userService.deleteUser(id);
    }
}
