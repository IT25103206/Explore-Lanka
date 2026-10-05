package com.project.webbasedtourismandtravelmanagementsystem.common.upload;

import com.project.webbasedtourismandtravelmanagementsystem.common.Access;
import com.project.webbasedtourismandtravelmanagementsystem.common.exception.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

/**
 * Image upload used by the admin forms (packages, events, promotions, hotels).
 * Files are saved outside the jar in {@code app.upload-dir}/images and served at /uploads/images/...
 * (see WebConfig), so they survive restarts and rebuilds.
 */
@RestController
@RequestMapping("/api/admin/uploads")
public class ImageUploadController {

    private static final long MAX_BYTES = 5L * 1024 * 1024;

    private final Path imageDir;

    public ImageUploadController(@Value("${app.upload-dir:uploads}") String uploadDir) {
        this.imageDir = Paths.get(uploadDir).toAbsolutePath().normalize().resolve("images");
    }

    @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize(Access.STAFF)
    public Map<String, String> uploadImage(@RequestParam("file") MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("Choose an image to upload");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new BusinessException(HttpStatus.PAYLOAD_TOO_LARGE, "The image must be 5 MB or smaller");
        }
        String ext = detectExtension(file);
        if (ext == null) {
            throw new BusinessException("Only JPG, PNG, WEBP or GIF images are allowed");
        }
        Files.createDirectories(imageDir);
        String name = UUID.randomUUID().toString().replace("-", "") + "." + ext;
        Path target = imageDir.resolve(name).normalize();
        if (!target.startsWith(imageDir)) {
            throw new BusinessException("Invalid file name");
        }
        try (InputStream in = file.getInputStream()) {
            Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
        }
        return Map.of("url", "/uploads/images/" + name);
    }

    /** Checks the real file content (magic bytes), not just the name the browser sent. */
    private static String detectExtension(MultipartFile file) throws IOException {
        byte[] h = new byte[12];
        int n;
        try (InputStream in = file.getInputStream()) {
            n = in.readNBytes(h, 0, h.length);
        }
        if (n >= 3 && (h[0] & 0xFF) == 0xFF && (h[1] & 0xFF) == 0xD8 && (h[2] & 0xFF) == 0xFF) return "jpg";
        if (n >= 8 && (h[0] & 0xFF) == 0x89 && h[1] == 'P' && h[2] == 'N' && h[3] == 'G') return "png";
        if (n >= 6 && h[0] == 'G' && h[1] == 'I' && h[2] == 'F' && h[3] == '8') return "gif";
        if (n >= 12 && h[0] == 'R' && h[1] == 'I' && h[2] == 'F' && h[3] == 'F'
                && h[8] == 'W' && h[9] == 'E' && h[10] == 'B' && h[11] == 'P') return "webp";
        return null;
    }
}
