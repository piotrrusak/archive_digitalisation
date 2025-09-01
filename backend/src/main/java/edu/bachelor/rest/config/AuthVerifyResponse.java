package edu.bachelor.rest.config;

public record AuthVerifyResponse(boolean valid, String user_id, String email) {}
