package com.abd.cognelearn.repository;

import com.abd.cognelearn.model.EmailCategory;
import com.abd.cognelearn.model.EmailTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmailTemplateRepository extends JpaRepository<EmailTemplate, Long> {
    Optional<EmailTemplate> findByCategory(EmailCategory category);
}
