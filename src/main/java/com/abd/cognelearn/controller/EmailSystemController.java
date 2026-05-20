package com.abd.cognelearn.controller;

import com.abd.cognelearn.model.EmailCategory;
import com.abd.cognelearn.model.EmailTemplate;
import com.abd.cognelearn.service.BulkEmailSenderService;
import com.abd.cognelearn.service.EmailTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/emails")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class EmailSystemController {

    private final EmailTemplateService templateService;
    private final BulkEmailSenderService senderService;

    @GetMapping("/template")
    public EmailTemplate getTemplate(@RequestParam EmailCategory category) {
        return templateService.getTemplate(category);
    }

    @PostMapping("/template")
    public void saveTemplate(@RequestBody Map<String, String> payload) {
        EmailCategory category = EmailCategory.valueOf(payload.get("category"));
        templateService.saveTemplate(category, payload.get("subject"), payload.get("body"));
    }

    @PostMapping("/send")
    public void sendEmail(@RequestBody Map<String, String> payload) {
        EmailCategory category = EmailCategory.valueOf(payload.get("category"));
        senderService.sendBulkEmail(category, payload.get("subject"), payload.get("body"));
    }

    @GetMapping("/count")
    public Map<String, Long> getCount(@RequestParam EmailCategory category) {
        long count = senderService.getAudienceCount(category);
        return Map.of("count", count);
    }
}
