package com.abd.cognelearn.controller;

import com.abd.cognelearn.model.UserEntity;
import com.abd.cognelearn.model.UserEvent;
import com.abd.cognelearn.repository.UserEventRepository;
import com.abd.cognelearn.service.CurrentUserService;
import com.abd.cognelearn.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
public class EventController {

    private final EmailService emailService;
    private final UserEventRepository userEventRepository;
    private final CurrentUserService currentUserService;

    @PostMapping
    public Map<String, String> handleEvent(@RequestBody Map<String, String> eventData) {
        String eventType = eventData.get("event");
        UserEntity user = currentUserService.requireUser();

        // 1. Persist the event for Admin Dashboard tracking
        userEventRepository.save(new UserEvent(user.getId(), eventType));

        // 2. Trigger appropriate automated email communications
        switch (eventType) {
            case "STREAK_7":
                emailService.sendMilestoneEmail(user.getEmail(), user.getName(), 7);
                break;
            case "STREAK_30":
                emailService.sendMilestoneEmail(user.getEmail(), user.getName(), 30);
                break;
            case "LOW_FOCUS":
                emailService.sendFocusTipEmail(user.getEmail(), user.getName());
                break;
            case "INACTIVITY":
                emailService.sendInactivityReminder(user.getEmail(), user.getName());
                break;
        }

        return Map.of("status", "processed", "event", eventType);
    }
}
