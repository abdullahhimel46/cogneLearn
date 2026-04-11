package com.cognelearn.controller;

import com.cognelearn.dto.session.AttentionScoreRequest;
import com.cognelearn.dto.session.SessionCompleteRequest;
import com.cognelearn.dto.session.SessionCreateRequest;
import com.cognelearn.dto.session.SessionResponse;
import com.cognelearn.service.StudySessionService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/sessions")
public class StudySessionController {
    private final StudySessionService studySessionService;

    public StudySessionController(StudySessionService studySessionService) {
        this.studySessionService = studySessionService;
    }

    @GetMapping
    public List<SessionResponse> list() {
        return studySessionService.listSessions();
    }

    @GetMapping("/{sessionId}")
    public SessionResponse get(@PathVariable UUID sessionId) {
        return studySessionService.getSession(sessionId);
    }

    @PostMapping
    public SessionResponse create(@Valid @RequestBody SessionCreateRequest request) {
        return studySessionService.createSession(request);
    }

    @PatchMapping("/{sessionId}/complete")
    public SessionResponse complete(@PathVariable UUID sessionId, @Valid @RequestBody SessionCompleteRequest request) {
        return studySessionService.completeSession(sessionId, request);
    }

    @PostMapping("/{sessionId}/attention")
    public SessionResponse addAttention(@PathVariable UUID sessionId, @Valid @RequestBody AttentionScoreRequest request) {
        return studySessionService.addAttentionScore(sessionId, request);
    }
}
