package com.globalcmx.api.dto.command;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Command for approving a draft and converting it to an operation.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApproveOperationCommand {

    private String draftId;
    private String approvedBy;
    private String comments;
}
