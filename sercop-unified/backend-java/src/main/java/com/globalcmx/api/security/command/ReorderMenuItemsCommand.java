package com.globalcmx.api.security.command;

import java.util.List;

public record ReorderMenuItemsCommand(
    List<ReorderItem> items
) {
    public record ReorderItem(
        Long id,
        Long parentId,
        Integer displayOrder
    ) {}
}
