package com.panther.pms.platform.controller;

import com.panther.pms.common.storage.FileStorageService;
import com.panther.pms.common.storage.StoredFile;
import com.panther.pms.platform.dto.FileUploadResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
public class FileUploadController {

    private final FileStorageService fileStorageService;

    /**
     * Generic upload used by every domain's photo/document fields (client documents,
     * employee documents, technician documents, damage/issue/preventive-task photos,
     * work-order photos, payment receipts, bill payment proofs — see BACKEND_PLAN.md
     * section 8). The caller links the returned URL into its own child table.
     */
    @PostMapping(consumes = "multipart/form-data")
    public FileUploadResponse upload(@RequestParam("file") MultipartFile file,
                                      @RequestParam(value = "folder", defaultValue = "general") String folder) {
        String safeFolder = StringUtils.hasText(folder) ? folder.replaceAll("[^a-zA-Z0-9_-]", "") : "general";
        StoredFile stored = fileStorageService.store(file, safeFolder);
        return new FileUploadResponse(stored.url(), stored.originalFilename(), stored.contentType(), stored.sizeLabel());
    }
}
