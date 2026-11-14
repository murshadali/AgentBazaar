import { calculateConcessionMove } from './concessionService.js';

/**
 * Mock Provider for local rule-based AI testing and offline development
 */
export const generateMockDecision = async ({
  actor,
  product,
  privateConfig,
  currentRound,
  maxRounds,
  offerHistory = []
}) => {
  // Deterministic rule-based calculation
  return calculateConcessionMove({
    actor,
    product,
    privateConfig,
    currentRound,
    maxRounds,
    offerHistory
  });
};
