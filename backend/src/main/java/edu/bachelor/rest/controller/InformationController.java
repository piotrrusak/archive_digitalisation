package edu.bachelor.rest.controller;

import edu.bachelor.rest.dto.AvailableModel;
import edu.bachelor.rest.service.InformationService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RequestMapping("/api/v1/information")
@RestController
@RequiredArgsConstructor
public class InformationController {

  private final InformationService informationService;

  @GetMapping("/available_models")
  public List<AvailableModel> getAvailableModels(HttpServletRequest request) {
    return this.informationService.getAvailableModels(request);
  }
}
