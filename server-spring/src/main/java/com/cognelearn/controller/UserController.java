package com.cognelearn.controller;

import com.cognelearn.dto.user.UserResponse;
import com.cognelearn.service.AuthService;
import com.cognelearn.service.CurrentUserService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {
    private final CurrentUserService currentUserService;
    private final AuthService authService;

    public UserController(CurrentUserService currentUserService, AuthService authService) {
        this.currentUserService = currentUserService;
        this.authService = authService;
    }

    @GetMapping("/me")
    public UserResponse me() {
        return authService.toUserResponse(currentUserService.requireUser());
    }
}
