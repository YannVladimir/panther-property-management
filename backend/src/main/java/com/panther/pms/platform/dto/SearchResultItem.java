package com.panther.pms.platform.dto;

public record SearchResultItem(
        String category,
        Long id,
        String title,
        String subtitle
) {
}
