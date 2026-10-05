package com.panther.pms.common.storage;

import com.panther.pms.common.exception.BadRequestException;
import com.panther.pms.config.FileStorageProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class LocalFileStorageService implements FileStorageService {

    private final FileStorageProperties properties;

    @Override
    public StoredFile store(MultipartFile file, String subfolder) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Uploaded file is empty.");
        }

        String extension = StringUtils.getFilenameExtension(file.getOriginalFilename());
        String storedName = UUID.randomUUID() + (StringUtils.hasText(extension) ? "." + extension : "");
        String datedSubfolder = subfolder + "/" + LocalDate.now();

        Path targetDir = Path.of(properties.baseDir(), datedSubfolder).toAbsolutePath().normalize();
        Path targetFile = targetDir.resolve(storedName);

        try {
            Files.createDirectories(targetDir);
            file.transferTo(targetFile);
        } catch (IOException e) {
            log.error("Failed to store uploaded file", e);
            throw new BadRequestException("Could not store uploaded file.");
        }

        String url = properties.publicUrlPrefix() + "/" + datedSubfolder + "/" + storedName;
        return new StoredFile(url, file.getOriginalFilename(), file.getContentType(), humanReadableSize(file.getSize()));
    }

    private String humanReadableSize(long bytes) {
        if (bytes < 1024) return bytes + " B";
        int exp = (int) (Math.log(bytes) / Math.log(1024));
        String unit = "KMGTPE".charAt(exp - 1) + "B";
        return String.format("%.1f %s", bytes / Math.pow(1024, exp), unit);
    }
}
