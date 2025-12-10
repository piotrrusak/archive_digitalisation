package edu.bachelor.rest.service;

import edu.bachelor.rest.model.User;
import edu.bachelor.rest.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

  private final UserRepository userRepository;

  @Transactional(readOnly = true)
  public List<User> getAllUsers() {
    return this.userRepository.findAll();
  }

  @Transactional(readOnly = true)
  public Optional<User> getUserById(@NonNull Long id) {
    return this.userRepository.findById(id);
  }

  public User saveUser(@NonNull User user) {
    return this.userRepository.save(user);
  }

  public void deleteUser(@NonNull Long id) {
    this.userRepository.deleteById(id);
  }
}
