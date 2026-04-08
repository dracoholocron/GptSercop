import type { ChatMessage, UIContext } from '../types/index.js';

export type IntentType = 'question' | 'navigate' | 'task' | 'data_query' | 'guided_flow' | 'smalltalk';

export interface ClassifiedIntent {
  type: IntentType;
  confidence: number;
  entities: Record<string, string>;
}

const INTENT_PATTERNS: Array<{ type: IntentType; patterns: RegExp[] }> = [
  {
    type: 'navigate',
    patterns: [
      /llev[aá]me\b/i, /\bir\s+a\b/i, /navegar?\b/i, /abrir?\b/i,
      /mostrar?\b/i, /muéstrame\b/i, /go\s+to\b/i, /navigate\b/i, /open\b/i,
    ],
  },
  {
    type: 'guided_flow',
    patterns: [
      /guí?[aá]me\b/i, /crear?\s+proceso\b/i, /nuevo\s+proceso\b/i,
      /paso\s+a\s+paso\b/i, /step\s+by\s+step\b/i, /help\s+me\s+create\b/i,
      /ayúdame\b/i, /asistir?\b/i, /tutorial\b/i,
    ],
  },
  {
    type: 'task',
    patterns: [
      /ejecutar?\b/i, /generar?\b/i, /calcular?\b/i, /exportar?\b/i,
      /run\b/i, /execute\b/i, /generate\b/i, /export\b/i,
    ],
  },
  {
    type: 'data_query',
    patterns: [
      /cuantos?\b/i, /cuántos?\b/i, /total\s+de\b/i, /estadísticas?\b/i,
      /listar?\b/i, /consultar?\b/i, /reporte\b/i, /informe\b/i,
      /how\s+many\b/i, /count\b/i, /query\b/i,
    ],
  },
  {
    type: 'question',
    patterns: [
      /qu[eé]\s+es\b/i, /c[oó]mo\b/i, /cu[aá]l\b/i, /por\s?qu[eé]\b/i,
      /what\b/i, /how\b/i, /which\b/i, /why\b/i, /explain\b/i,
    ],
  },
];

export function classifyIntent(
  message: string,
  _context?: UIContext,
  _history?: ChatMessage[],
): ClassifiedIntent {
  const lower = message.toLowerCase();

  for (const { type, patterns } of INTENT_PATTERNS) {
    for (const p of patterns) {
      if (p.test(lower)) {
        return { type, confidence: 0.8, entities: {} };
      }
    }
  }

  if (lower.length < 20 && !lower.includes('?')) {
    return { type: 'smalltalk', confidence: 0.6, entities: {} };
  }

  return { type: 'question', confidence: 0.5, entities: {} };
}
