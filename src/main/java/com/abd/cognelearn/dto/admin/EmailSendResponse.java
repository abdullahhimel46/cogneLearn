package com.abd.cognelearn.dto.admin;

public record EmailSendResponse(boolean sent, String recipientEmail, String message) {
}
