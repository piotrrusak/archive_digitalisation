package edu.bachelor.rest.utils;

import com.syncfusion.licensing.SyncfusionLicenseProvider;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class SyncfusionConfig {

  @Value("${syncfusion.license-key}")
  private String syncfusionLicenseKey;

  @PostConstruct
  public void init() {
    SyncfusionLicenseProvider.registerLicense(this.syncfusionLicenseKey);
  }
}
