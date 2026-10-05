package com.panther.pms.platform.controller;

import com.panther.pms.platform.dto.SearchResultItem;
import com.panther.pms.platform.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/search")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('OPERATIONS', 'ADMIN', 'OWNER')")
public class SearchController {

    private final SearchService searchService;

    @GetMapping
    public List<SearchResultItem> search(@RequestParam String q) {
        return searchService.search(q);
    }
}
