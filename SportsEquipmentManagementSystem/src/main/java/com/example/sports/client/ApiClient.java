package com.example.sports.client;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;

/**
 * Swing API Client for communicating with the Spring Boot REST API.
 * Uses Java 21 java.net.http.HttpClient and Jackson ObjectMapper.
 */
public class ApiClient {

    private static final String DEFAULT_BASE_URL = "http://localhost:8080/api";
    private final String baseUrl;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public ApiClient() {
        this(DEFAULT_BASE_URL);
    }

    public ApiClient(String baseUrl) {
        this.baseUrl = baseUrl;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    // Generic GET for single object
    public <T> T get(String endpoint, Class<T> responseType) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + endpoint))
                .header("Accept", "application/json")
                .timeout(Duration.ofSeconds(8))
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        handleErrorIfNeeded(response);
        return objectMapper.readValue(response.body(), responseType);
    }

    // Generic GET for List of objects
    public <T> List<T> getList(String endpoint, Class<T> elementType) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + endpoint))
                .header("Accept", "application/json")
                .timeout(Duration.ofSeconds(8))
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        handleErrorIfNeeded(response);
        return objectMapper.readValue(response.body(),
                objectMapper.getTypeFactory().constructCollectionType(List.class, elementType));
    }

    // Generic POST
    public <T> T post(String endpoint, Object body, Class<T> responseType) throws Exception {
        String jsonPayload = objectMapper.writeValueAsString(body);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + endpoint))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .timeout(Duration.ofSeconds(8))
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        handleErrorIfNeeded(response);
        if (responseType == Void.class || response.body() == null || response.body().trim().isEmpty()) {
            return null;
        }
        return objectMapper.readValue(response.body(), responseType);
    }

    // Generic PUT
    public <T> T put(String endpoint, Object body, Class<T> responseType) throws Exception {
        String jsonPayload = body != null ? objectMapper.writeValueAsString(body) : "";
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + endpoint))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .timeout(Duration.ofSeconds(8))
                .PUT(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        handleErrorIfNeeded(response);
        if (responseType == Void.class || response.body() == null || response.body().trim().isEmpty()) {
            return null;
        }
        return objectMapper.readValue(response.body(), responseType);
    }

    // Generic DELETE
    public void delete(String endpoint) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + endpoint))
                .header("Accept", "application/json")
                .timeout(Duration.ofSeconds(8))
                .DELETE()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        handleErrorIfNeeded(response);
    }

    // Parse Spring Boot JSON error response if status is not 2xx
    private void handleErrorIfNeeded(HttpResponse<String> response) throws Exception {
        int status = response.statusCode();
        if (status >= 200 && status < 300) {
            return;
        }

        String message = "Server responded with error status: " + status;
        try {
            JsonNode root = objectMapper.readTree(response.body());
            if (root.has("message") && !root.get("message").asText().isEmpty()) {
                message = root.get("message").asText();
            } else if (root.has("error")) {
                message = root.get("error").asText();
            }
        } catch (Exception ignored) {
            if (response.body() != null && !response.body().trim().isEmpty()) {
                message = response.body();
            }
        }
        throw new Exception(message);
    }

    public boolean checkHealth() {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/dashboard"))
                    .timeout(Duration.ofSeconds(3))
                    .GET()
                    .build();
            HttpResponse<String> res = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return res.statusCode() >= 200 && res.statusCode() < 300;
        } catch (Exception e) {
            return false;
        }
    }
}
