package edu.bachelor.rest.service;

import edu.bachelor.rest.model.Format;
import edu.bachelor.rest.repository.FormatRepository;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class FormatService {

  private final FormatRepository formatRepository;

  @Transactional(readOnly = true)
  public List<Format> getAllFormats() {
    return this.formatRepository.findAll();
  }

  @Transactional(readOnly = true)
  public Optional<Format> getFormatById(Long id) {
    if (id == null) {
      throw new IllegalArgumentException("Id cannot be null");
    }
    return this.formatRepository.findById(id);
  }

  public Format saveFormat(Format format) {
    if (format == null) {
      throw new IllegalArgumentException("Format cannot be null");
    }
    return this.formatRepository.save(format);
  }

  public void deleteFormatById(Long id) {
    if (id == null) {
      throw new IllegalArgumentException("Id cannot be null");
    }
    this.formatRepository.deleteById(id);
  }
}
