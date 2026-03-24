package com.globalcmx.api.compraspublicas.paa.repository;

import com.globalcmx.api.compraspublicas.paa.entity.CPPAAWorkspaceProposalVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CPPAAWorkspaceProposalVoteRepository extends JpaRepository<CPPAAWorkspaceProposalVote, Long> {

    List<CPPAAWorkspaceProposalVote> findByProposalIdOrderByVotedAtAsc(Long proposalId);

    Optional<CPPAAWorkspaceProposalVote> findByProposalIdAndVoterUserId(Long proposalId, String voterUserId);
}
