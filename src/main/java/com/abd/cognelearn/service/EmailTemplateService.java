package com.abd.cognelearn.service;

import com.abd.cognelearn.model.EmailCategory;
import com.abd.cognelearn.model.EmailTemplate;
import com.abd.cognelearn.repository.EmailTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EmailTemplateService {

    private final EmailTemplateRepository repository;

    public EmailTemplate getTemplate(EmailCategory category) {
        return repository.findByCategory(category)
                .orElseGet(() -> {
                    // Return a default blank template if none exists
                    return EmailTemplate.builder()
                            .category(category)
                            .subject("")
                            .body("")
                            .build();
                });
    }

    @Transactional
    public EmailTemplate saveTemplate(EmailCategory category, String subject, String body) {
        EmailTemplate template = repository.findByCategory(category).orElse(new EmailTemplate());
        template.setCategory(category);
        template.setSubject(subject);
        template.setBody(body);
        return repository.save(template);
    }
}
