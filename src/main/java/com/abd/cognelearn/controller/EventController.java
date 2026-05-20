package com.abd.cognelearn.controller;

import com.abd.cognelearn.model.UserEntity;
import com.abd.cognelearn.model.UserEvent;
import com.abd.cognelearn.repository.UserEventRepository;
import com.abd.cognelearn.service.CurrentUserService;
import com.abd.cognelearn.service.PendingNotificationService;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
public class EventController {

    private final UserEventRepository userEventRepository;
    private final CurrentUserService currentUserService;
    private final PendingNotificationService pendingNotificationService;

    @PostMapping
    public Map<String, String> handleEvent(@RequestBody Map<String, String> eventData) {
        String eventType = eventData.get("event");
        if (eventType == null) {
            return Map.of("status", "ignored", "reason", "missing_event");
        }

        String normalized = eventType.trim().toUpperCase();
        UserEntity user = currentUserService.requireUser();

        userEventRepository.save(new UserEvent(user.getId(), normalized));
        boolean queued = pendingNotificationService.enqueueFromEvent(user.getId(), normalized);

        return Map.of(
                "status", "processed",
                "event", normalized,
                "queued", queued ? "true" : "false"
        );
    }
}
