package com.panther.pms.common.storage;

import org.springframework.web.multipart.MultipartFile;

/**
 * Abstraction over where uploaded binaries (photos, documents, receipts, proofs) live.
 * MVP implementation writes to local disk; swap for an S3/MinIO-backed implementation
 * in production without touching any calling code (see BACKEND_PLAN.md section 9).
 */
public interface FileStorageService {

    StoredFile store(MultipartFile file, String subfolder);
}
