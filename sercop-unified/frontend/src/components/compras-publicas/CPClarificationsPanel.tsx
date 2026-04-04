/**
 * CPClarificationsPanel - Panel de preguntas y aclaraciones de un proceso
 * Vista diferenciada: proveedor (enviar pregunta) / entidad+admin (responder)
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Spinner,
  Icon,
  Flex,
  Textarea,
  Separator,
} from '@chakra-ui/react';
import { FiMessageCircle, FiSend, FiCheckCircle, FiClock } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { toaster } from '../ui/toaster';
import { get, post, patch } from '../../utils/apiClient';

interface Clarification {
  id: string;
  tenderId: string;
  question: string;
  answer: string | null;
  answeredAt: string | null;
  askedAt: string;
  status: 'OPEN' | 'ANSWERED';
  askedByProvider?: { id: string; name: string; identifier: string } | null;
}

interface CPClarificationsPanelProps {
  tenderId: string;
  userRole?: string;
  providerId?: string;
  tenderStatus?: string;
}

export const CPClarificationsPanel: React.FC<CPClarificationsPanelProps> = ({
  tenderId,
  userRole,
  tenderStatus,
}) => {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  const [clarifications, setClarifications] = useState<Clarification[]>([]);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [answerText, setAnswerText] = useState<Record<string, string>>({});
  const [answeringId, setAnsweringId] = useState<string | null>(null);

  const cardBg = isDark ? 'gray.800' : 'white';
  const borderColor = isDark ? 'gray.700' : 'gray.200';
  const mutedColor = isDark ? 'gray.400' : 'gray.500';

  const canAsk = userRole === 'supplier' || userRole === 'cp.proveedor';
  const canAnswer = userRole === 'entity' || userRole === 'admin' || userRole === 'cp.analista' || userRole === 'cp.admin' || userRole === 'ROLE_ADMIN';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get(`/v1/tenders/${tenderId}/clarifications`);
      if (res.ok) {
        const data = await res.json();
        setClarifications(Array.isArray(data?.data) ? data.data : []);
      }
    } catch {
      // Silent fail – panel shows empty state
    } finally {
      setLoading(false);
    }
  }, [tenderId]);

  useEffect(() => { load(); }, [load]);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setSubmitting(true);
    try {
      const res = await post(`/v1/tenders/${tenderId}/clarifications`, { question: question.trim() });
      if (res.ok) {
        setQuestion('');
        toaster.create({ title: t('cp.clarifications.sent', 'Pregunta enviada'), type: 'success' });
        load();
      } else {
        const err = await res.json().catch(() => ({}));
        toaster.create({ title: err?.error || t('common.error', 'Error'), type: 'error' });
      }
    } catch {
      toaster.create({ title: t('common.networkError', 'Error de red'), type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnswer = async (clarificationId: string) => {
    const answer = answerText[clarificationId]?.trim();
    if (!answer) return;
    setAnsweringId(clarificationId);
    try {
      const res = await patch(`/v1/tender-clarifications/${clarificationId}`, { answer });
      if (res.ok) {
        setAnswerText(prev => ({ ...prev, [clarificationId]: '' }));
        toaster.create({ title: t('cp.clarifications.answered', 'Respuesta enviada'), type: 'success' });
        load();
      } else {
        const err = await res.json().catch(() => ({}));
        toaster.create({ title: err?.error || t('common.error', 'Error'), type: 'error' });
      }
    } catch {
      toaster.create({ title: t('common.networkError', 'Error de red'), type: 'error' });
    } finally {
      setAnsweringId(null);
    }
  };

  if (loading) {
    return (
      <Flex justify="center" py={8}>
        <Spinner size="md" />
      </Flex>
    );
  }

  return (
    <VStack gap={4} align="stretch">
      {/* Ask question form (suppliers only, when tender is published) */}
      {canAsk && tenderStatus === 'published' && (
        <Box bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} p={4}>
          <Text fontWeight="600" mb={3} fontSize="sm">
            {t('cp.clarifications.askQuestion', 'Enviar pregunta de aclaración')}
          </Text>
          <VStack gap={2} align="stretch">
            <Textarea
              placeholder={t('cp.clarifications.questionPlaceholder', 'Escriba su pregunta sobre el proceso...')}
              value={question}
              onChange={e => setQuestion(e.target.value)}
              rows={3}
              fontSize="sm"
            />
            <Flex justify="flex-end">
              <Button
                size="sm"
                colorPalette="blue"
                onClick={handleAsk}
                disabled={submitting || !question.trim()}
                loading={submitting}
              >
                <Icon as={FiSend} mr={2} />
                {t('cp.clarifications.send', 'Enviar')}
              </Button>
            </Flex>
          </VStack>
        </Box>
      )}

      {/* List */}
      {clarifications.length === 0 ? (
        <Box textAlign="center" py={10}>
          <Icon as={FiMessageCircle} boxSize={8} color="gray.400" mb={2} />
          <Text color={mutedColor} fontSize="sm">
            {t('cp.clarifications.empty', 'No hay preguntas de aclaración aún')}
          </Text>
        </Box>
      ) : (
        <VStack gap={3} align="stretch">
          {clarifications.map((c) => (
            <Box key={c.id} bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor} p={4}>
              <HStack justify="space-between" mb={2}>
                <HStack gap={2}>
                  <Icon as={FiMessageCircle} color="blue.400" boxSize={4} />
                  <Text fontWeight="600" fontSize="sm">
                    {c.askedByProvider?.name || t('cp.clarifications.anonymous', 'Proveedor')}
                  </Text>
                </HStack>
                <HStack gap={2}>
                  <Badge
                    colorPalette={c.status === 'ANSWERED' ? 'green' : 'orange'}
                    variant="subtle"
                    fontSize="xs"
                  >
                    {c.status === 'ANSWERED' ? (
                      <><Icon as={FiCheckCircle} mr={1} />{t('cp.clarifications.answered_badge', 'Respondida')}</>
                    ) : (
                      <><Icon as={FiClock} mr={1} />{t('cp.clarifications.pending_badge', 'Pendiente')}</>
                    )}
                  </Badge>
                  <Text fontSize="xs" color={mutedColor}>
                    {new Date(c.askedAt).toLocaleDateString('es-EC')}
                  </Text>
                </HStack>
              </HStack>

              <Box bg={isDark ? 'gray.750' : 'gray.50'} borderRadius="md" p={3} mb={c.answer ? 2 : 0}>
                <Text fontSize="sm">{c.question}</Text>
              </Box>

              {c.answer && (
                <>
                  <Separator my={2} />
                  <HStack gap={2} mb={1}>
                    <Icon as={FiCheckCircle} color="green.400" boxSize={4} />
                    <Text fontSize="xs" fontWeight="600" color={isDark ? 'green.300' : 'green.600'}>
                      {t('cp.clarifications.officialAnswer', 'Respuesta oficial')}
                    </Text>
                    {c.answeredAt && (
                      <Text fontSize="xs" color={mutedColor}>
                        {new Date(c.answeredAt).toLocaleDateString('es-EC')}
                      </Text>
                    )}
                  </HStack>
                  <Box bg={isDark ? 'green.900' : 'green.50'} borderRadius="md" p={3}>
                    <Text fontSize="sm">{c.answer}</Text>
                  </Box>
                </>
              )}

              {/* Answer form for entity/admin */}
              {canAnswer && c.status === 'OPEN' && (
                <Box mt={3}>
                  <Textarea
                    placeholder={t('cp.clarifications.answerPlaceholder', 'Escriba la respuesta oficial...')}
                    value={answerText[c.id] || ''}
                    onChange={e => setAnswerText(prev => ({ ...prev, [c.id]: e.target.value }))}
                    rows={2}
                    fontSize="sm"
                    mb={2}
                  />
                  <Flex justify="flex-end">
                    <Button
                      size="sm"
                      colorPalette="green"
                      onClick={() => handleAnswer(c.id)}
                      disabled={answeringId === c.id || !answerText[c.id]?.trim()}
                      loading={answeringId === c.id}
                    >
                      <Icon as={FiSend} mr={2} />
                      {t('cp.clarifications.submitAnswer', 'Publicar respuesta')}
                    </Button>
                  </Flex>
                </Box>
              )}
            </Box>
          ))}
        </VStack>
      )}
    </VStack>
  );
};

export default CPClarificationsPanel;
