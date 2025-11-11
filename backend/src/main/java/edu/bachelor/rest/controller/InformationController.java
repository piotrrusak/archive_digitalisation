package edu.bachelor.rest.controller;

import edu.bachelor.rest.dto.AvailableModels;
import edu.bachelor.rest.service.InformationService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RequestMapping("/api/v1/information")
@RestController
@RequiredArgsConstructor
public class InformationController {

  private InformationService informationService;

  @GetMapping("/available_models")
  public AvailableModels getAvailableModels(HttpServletRequest request) {
    return this.informationService.getAvailableModels(request);
  }
}
