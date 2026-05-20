package com.abd.cognelearn.controller;

import com.abd.cognelearn.dto.admin.EmailSendResponse;
import com.abd.cognelearn.dto.admin.EmailStatusResponse;
import com.abd.cognelearn.dto.admin.PendingNotificationResponse;
import com.abd.cognelearn.dto.admin.SendCustomEmailRequest;
import com.abd.cognelearn.dto.admin.SendPendingNotificationRequest;
import com.abd.cognelearn.service.PendingNotificationService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/notifications")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminNotificationController {

    private final PendingNotificationService pendingNotificationService;

    @Value("${cognelearn.email.enabled:false}")
    private boolean emailEnabled;

    @GetMapping("/status")
    public EmailStatusResponse emailStatus() {
        return new EmailStatusResponse(emailEnabled, emailEnabled ? "SMTP" : "disabled (no-op)");
    }

    @GetMapping("/pending")
    public List<PendingNotificationResponse> listPending() {
        return pendingNotificationService.listPending();
    }

    @PostMapping("/send-custom")
    public EmailSendResponse sendCustom(@Valid @RequestBody SendCustomEmailRequest body) {
        String sentTo = pendingNotificationService.sendCustomEmail(
                body.userId(),
                body.subject(),
                body.message()
        );
        return new EmailSendResponse(true, sentTo, "Email sent successfully.");
    }

    @PostMapping("/{id}/send")
    public void send(@PathVariable UUID id, @RequestBody(required = false) SendPendingNotificationRequest body) {
        String subject = body != null ? body.subject() : null;
        String message = body != null ? body.message() : null;
        pendingNotificationService.sendApproved(id, subject, message);
    }
}
