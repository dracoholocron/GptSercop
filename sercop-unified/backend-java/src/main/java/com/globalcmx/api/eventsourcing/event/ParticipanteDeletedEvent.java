package com.globalcmx.api.eventsourcing.event;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class ParticipanteDeletedEvent extends DomainEvent {
    private Long participanteId;

    public ParticipanteDeletedEvent(Long participanteId, String performedBy) {
        super("PARTICIPANTE_DELETED", performedBy);
        this.participanteId = participanteId;
    }
}
