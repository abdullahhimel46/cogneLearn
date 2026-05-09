package com.cognelearn.repository;

import com.cognelearn.model.AttentionScoreEntity;
import com.cognelearn.model.StudySessionEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * AttentionScoreRepository — handles database operations for {@link AttentionScoreEntity}.
 *
 * <p>Each attention score is one measurement from the face-api.js attention tracker,
 * recorded approximately every 1.5 seconds during an active study session.
 *
 * <p>Maps to JS: the {@code session.attentionScores} array stored in {@code StudySession.js}.
 */
public interface AttentionScoreRepository extends JpaRepository<AttentionScoreEntity, UUID> {

    /**
     * Get all attention scores recorded during a specific study session.
     *
     * <p>Generated SQL: {@code SELECT * FROM attention_scores WHERE session_id = ? ORDER BY created_at}
     *
     * <p>Used by {@code AnalyticsService} to calculate average attention for a session.
     *
     * <p>Maps to JS: {@code session.attentionScores} array access.
     *
     * @param session the session to get scores for
     * @return list of attention scores, in recording order
     */
    List<AttentionScoreEntity> findAllBySession(StudySessionEntity session);
}
