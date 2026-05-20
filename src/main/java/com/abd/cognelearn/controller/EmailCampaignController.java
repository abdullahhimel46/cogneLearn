package com.abd.cognelearn.controller;

import com.abd.cognelearn.model.EmailCategory;
import com.abd.cognelearn.model.EmailTemplate;
import com.abd.cognelearn.model.UserEntity;
import com.abd.cognelearn.repository.UserRepository;
import com.abd.cognelearn.service.BulkEmailSenderService;
import com.abd.cognelearn.service.EmailTemplateService;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class EmailCampaignController {

    private final UserRepository userRepository;
    private final EmailTemplateService templateService;
    private final BulkEmailSenderService senderService;

    @GetMapping("/users")
    public List<UserResponse> getUsers() {
        return userRepository.findAll().stream()
                .filter(u -> !u.getRole().equals("ADMIN")) // omit admin if needed
                .map(u -> new UserResponse(u.getId(), u.getName(), u.getEmail()))
                .collect(Collectors.toList());
    }

    @GetMapping("/email-template")
    public EmailTemplateResponse getTemplate(@RequestParam EmailCategory category) {
        EmailTemplate template = templateService.getTemplate(category);
        return new EmailTemplateResponse(template.getSubject(), template.getBody());
    }

    @PostMapping("/send-email")
    public ResponseEntity<?> sendEmail(@RequestBody EmailRequest req) {
        // Send email logic (Async)
        senderService.sendBulkCampaign(req.getRecipients(), req.getSubject(), req.getMessage());
        return ResponseEntity.ok("Emails sent");
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class UserResponse {
        private UUID id;
        private String name;
        private String email;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class EmailTemplateResponse {
        private String subject;
        private String body;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class EmailRequest {
        private List<Recipient> recipients;
        private String subject;
        private String message;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class Recipient {
        private UUID id;
        private String name;
        private String email;
    }
}
