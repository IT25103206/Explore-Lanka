package com.project.webbasedtourismandtravelmanagementsystem.tourpackage.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@Service
public class PackageImageStorageService {

    public static final long MAX_IMAGE_SIZE = 5L * 1024L * 1024L;
    public static final String PUBLIC_PATH = "/uploads/package-images/";

    private static final Map<String, String> ALLOWED_TYPES = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp"
    );

    private final Path storageDirectory;

    public PackageImageStorageService(
            @Value("${app.upload.package-images-dir:uploads/package-images}")
            String storageDirectory) {
        this.storageDirectory = Paths.get(storageDirectory)
                .toAbsolutePath()
                .normalize();
        createStorageDirectory();
    }

    public String store(MultipartFile image) {
        validate(image);

        String extension = ALLOWED_TYPES.get(image.getContentType());
        String fileName = UUID.randomUUID() + extension;
        Path target = storageDirectory.resolve(fileName).normalize();

        if (!target.startsWith(storageDirectory)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid package image path"
            );
        }

        try (InputStream inputStream = image.getInputStream()) {
            Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException exception) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Could not save the package image",
                    exception
            );
        }

        return PUBLIC_PATH + fileName;
    }

    public void delete(String imageUrl) {
        if (imageUrl == null || !imageUrl.startsWith(PUBLIC_PATH)) {
            return;
        }

        String fileName = imageUrl.substring(PUBLIC_PATH.length());
        Path target = storageDirectory.resolve(fileName).normalize();
        if (!target.startsWith(storageDirectory)) {
            return;
        }

        try {
            Files.deleteIfExists(target);
        } catch (IOException ignored) {
            // A failed cleanup must not make an otherwise valid database change fail.
        }
    }

    public Path getStorageDirectory() {
        return storageDirectory;
    }

    private void validate(MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Please select a package image"
            );
        }
        if (image.getSize() > MAX_IMAGE_SIZE) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Package image must be 5 MB or smaller"
            );
        }
        if (!ALLOWED_TYPES.containsKey(image.getContentType())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only JPG, PNG and WebP package images are allowed"
            );
        }
    }

    private void createStorageDirectory() {
        try {
            Files.createDirectories(storageDirectory);
        } catch (IOException exception) {
            throw new IllegalStateException(
                    "Could not create package image storage directory",
                    exception
            );
        }
    }
}
