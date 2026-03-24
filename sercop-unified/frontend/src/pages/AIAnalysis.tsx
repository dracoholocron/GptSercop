/**
 * AIAnalysis - Guided AI Assistant for operations analysis
 *
 * Features:
 * - Category-based navigation
 * - Enhanced search bar with autocomplete
 * - Quick actions for common queries
 * - Free-form text queries support
 * - Guided input for options that require parameters
 */

import { useState, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Spinner,
} from '@chakra-ui/react';
import { FiCpu } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { aiAssistantService, type AIResponse } from '../services/aiAssistantService';
import {
  AI_CATEGORIES,
  type AICategory,
  type AIOption,
  type AIQuickAction,
} from '../config/aiCategories';
import {
  AICategoryGrid,
  AISearchBar,
  AIOptionsList,
  AIResultsPanel,
  AIQuickActions,
  AIHelpButton,
} from '../components/ai';

type ViewState = 'categories' | 'options' | 'results';

export const AIAnalysis = () => {
  const { t } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();

  // State
  const [view, setView] = useState<ViewState>('categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AICategory | null>(null);
  const [selectedOption, setSelectedOption] = useState<AIOption | null>(null);
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState<string>('últimos 3 meses');

  // Handlers
  const handleCategorySelect = useCallback((category: AICategory) => {
    setSelectedCategory(category);
    setSearchQuery('');
    setView('options');
  }, []);

  const handleOptionSelect = useCallback((option: AIOption, category: AICategory) => {
    setSelectedCategory(category);
    setSelectedOption(option);
    setSearchQuery('');

    if (!option.requiresInput) {
      executeHandler(option.handler);
    } else {
      setView('options');
    }
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearchQuery('');
  }, []);

  const handleExecute = useCallback((option: AIOption, inputValue?: string) => {
    setSelectedOption(option);
    executeHandler(option.handler, inputValue);
  }, []);

  const handleQuickAction = useCallback((action: AIQuickAction) => {
    // Find the option and category for this quick action
    for (const category of AI_CATEGORIES) {
      const option = category.options.find(o => o.handler === action.handler);
      if (option) {
        setSelectedCategory(category);
        setSelectedOption(option);
        executeHandler(action.handler, action.params);
        return;
      }
    }
  }, []);

  // Handle free-form text queries
  const handleFreeFormSubmit = useCallback(async (query: string) => {
    setLoading(true);
    setSearchQuery('');

    // Create a synthetic option for free-form queries
    const freeFormOption: AIOption = {
      id: 'freeform',
      titleKey: 'ai.freeFormQuery',
      descriptionKey: 'ai.freeFormQueryDesc',
      icon: FiCpu,
      handler: 'FREEFORM',
    };

    const freeFormCategory: AICategory = {
      id: 'freeform',
      icon: FiCpu,
      titleKey: 'ai.freeFormCategory',
      descriptionKey: 'ai.freeFormCategoryDesc',
      color: 'purple',
      options: [freeFormOption],
    };

    setSelectedCategory(freeFormCategory);
    setSelectedOption(freeFormOption);

    try {
      // Use the original processPrompt for free-form queries
      const result = await aiAssistantService.processPrompt(query);
      setResponse(result);
      setView('results');
    } catch (error) {
      console.error('Error processing free-form query:', error);
      setResponse({
        success: false,
        message: t('ai.errorProcessing', 'Error al procesar la consulta'),
        results: [{
          type: 'error',
          title: 'Error',
          data: { message: error instanceof Error ? error.message : 'Unknown error' }
        }],
      });
      setView('results');
    } finally {
      setLoading(false);
    }
  }, [t]);

  const executeHandler = async (handlerId: string, param?: string) => {
    setLoading(true);
    try {
      // Track period for COMMISSIONS_CHARGED
      if (handlerId === 'COMMISSIONS_CHARGED' && param) {
        setCurrentPeriod(param);
      }
      const result = await aiAssistantService.executeHandler(handlerId, param);
      setResponse(result);
      setView('results');
    } catch (error) {
      console.error('Error executing handler:', error);
      setResponse({
        success: false,
        message: t('ai.errorProcessing', 'Error al procesar la consulta'),
        results: [{
          type: 'error',
          title: 'Error',
          data: { message: error instanceof Error ? error.message : 'Unknown error' }
        }],
      });
      setView('results');
    } finally {
      setLoading(false);
    }
  };

  // Handle period change for COMMISSIONS_CHARGED
  const handleChangePeriod = (period: string) => {
    setCurrentPeriod(period);
    executeHandler('COMMISSIONS_CHARGED', period);
  };

  const handleBackToCategories = useCallback(() => {
    setView('categories');
    setSelectedCategory(null);
    setSelectedOption(null);
    setResponse(null);
    setSearchQuery('');
  }, []);

  const handleBackToCategory = useCallback(() => {
    setView('options');
    setSelectedOption(null);
    setResponse(null);
  }, []);

  // Render content based on view state
  const renderContent = () => {
    switch (view) {
      case 'options':
        if (!selectedCategory) return null;
        return (
          <AIOptionsList
            category={selectedCategory}
            onBack={handleBackToCategories}
            onExecute={handleExecute}
            loading={loading}
          />
        );

      case 'results':
        if (!response || !selectedOption || !selectedCategory) return null;
        return (
          <AIResultsPanel
            response={response}
            option={selectedOption}
            category={selectedCategory}
            onNewQuery={handleBackToCategories}
            onBackToCategory={handleBackToCategory}
            onChangePeriod={handleChangePeriod}
            currentPeriod={currentPeriod}
          />
        );

      case 'categories':
      default:
        return (
          <VStack gap={6} align="stretch">
            <Text fontSize="md" color={colors.textColorSecondary}>
              {t('ai.whatToAnalyze')}
            </Text>
            <AICategoryGrid onCategorySelect={handleCategorySelect} />
            <Box mt={4}>
              <AIQuickActions onActionClick={handleQuickAction} loading={loading} />
            </Box>
          </VStack>
        );
    }
  };

  // Handle example click from help button
  const handleHelpExampleClick = useCallback((query: string) => {
    setSearchQuery(query);
    // Trigger the free-form submit after a short delay to show the query
    setTimeout(() => {
      handleFreeFormSubmit(query);
    }, 300);
  }, [handleFreeFormSubmit]);

  return (
    <Box h="calc(100vh - 120px)" display="flex" flexDirection="column">
      {/* Header */}
      <Box p={4} borderBottom="1px" borderColor={colors.borderColor}>
        <HStack justify="space-between">
          <HStack gap={3}>
            <Box p={2} bg="purple.100" borderRadius="lg">
              <FiCpu size={24} color="var(--chakra-colors-purple-600)" />
            </Box>
            <Box>
              <Heading size="md" color={colors.textColor}>
                {t('ai.title')}
              </Heading>
              <Text fontSize="sm" color={colors.textColorSecondary}>
                {t('ai.category.statisticsDesc')}
              </Text>
            </Box>
          </HStack>
          <AIHelpButton onExampleClick={handleHelpExampleClick} />
        </HStack>
      </Box>

      {/* Content Area */}
      <Box flex={1} overflowY="auto" p={6}>
        {/* Enhanced Search Bar - Always visible except in results view */}
        {view !== 'results' && (
          <AISearchBar
            value={searchQuery}
            onChange={handleSearchChange}
            onClear={handleSearchClear}
            onOptionSelect={handleOptionSelect}
            onFreeFormSubmit={handleFreeFormSubmit}
          />
        )}

        {/* Loading state */}
        {loading && (
          <VStack py={8}>
            <Spinner size="lg" color="purple.500" />
            <Text color={colors.textColorSecondary}>{t('ai.loading')}</Text>
          </VStack>
        )}

        {/* Main content */}
        {!loading && renderContent()}
      </Box>
    </Box>
  );
};

export default AIAnalysis;
