package com.globalcmx.api.document.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * Request DTO for uploading a document.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UploadDocumentRequest {

    private String operationId;

    private String eventId;

    private String alertId;

    @NotBlank(message = "Category code is required")
    @Size(max = 50)
    private String categoryCode;

    @Size(max = 50)
    private String subcategoryCode;

    @NotBlank(message = "Document type code is required")
    @Size(max = 50)
    private String documentTypeCode;

    private List<String> tags;

    @Size(max = 20)
    private String accessLevel; // PUBLIC, RESTRICTED, CONFIDENTIAL

    @Size(max = 1000)
    private String changeNotes;
}
