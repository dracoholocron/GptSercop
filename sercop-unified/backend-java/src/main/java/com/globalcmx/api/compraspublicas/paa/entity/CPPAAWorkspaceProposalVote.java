package com.globalcmx.api.compraspublicas.paa.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "cp_paa_workspace_proposal_vote")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class CPPAAWorkspaceProposalVote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proposal_id", nullable = false)
    @JsonIgnoreProperties("votes")
    private CPPAAWorkspaceProposal proposal;

    @Column(name = "voter_user_id", nullable = false, length = 100)
    private String voterUserId;

    @Column(name = "voter_name", nullable = false, length = 200)
    private String voterName;

    @Column(name = "vote_type", nullable = false, length = 10)
    private String voteType;

    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;

    @Column(name = "voted_at", updatable = false)
    @Builder.Default
    private LocalDateTime votedAt = LocalDateTime.now();
}
