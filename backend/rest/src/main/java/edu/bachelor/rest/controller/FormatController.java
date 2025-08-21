package edu.bachelor.rest.controller;

import edu.bachelor.rest.model.Format;
import edu.bachelor.rest.service.FormatService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/format")
public class FormatController {

    private final FormatService formatService;

    @GetMapping
    public List<Format> getAllFormats() {
        return this.formatService.getAllFormats();
    }

    @GetMapping("/{id}")
    public Format getFormatById(@PathVariable Long id) throws Exception {
        return this.formatService.getFormatById(id).orElseThrow(() -> new Exception(""));
    }

    @PostMapping
    public Format saveFormat(@RequestBody Format format) {
        return this.formatService.saveFormat(format);
    }

    @DeleteMapping("/{id}")
    public void deleteFormatById(@PathVariable Long id) {
        this.formatService.deleteFormatById(id);
    }

}
