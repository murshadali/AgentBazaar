/**
 * Concession policy parameters for deterministic fallback and guidance.
 * Beta exponents govern polynomial time-concession curves:
 *   beta > 1 (Boulware curve: concedes slowly, holds ground until later rounds)
 *   beta = 1 (Linear: steady, equal concessions round by round)
 *   beta < 1 (Conceder curve: concedes quickly to reach agreement)
 */

export const CONCESSION_CONSTANTS = {
  FIRM: {
    name: 'FIRM',
    beta: 2.2,
    description: 'Conservatively protects preferred price with minimal early concessions.'
  },
  BALANCED: {
    name: 'BALANCED',
    beta: 1.0,
    description: 'Moderate linear concessions aimed at a fair mutual compromise.'
  },
  FLEXIBLE: {
    name: 'FLEXIBLE',
    beta: 0.45,
    description: 'Generous concessions designed to secure a deal quickly.'
  }
};

export const SYSTEM_LIMITS = {
  MIN_ROUNDS: 1,
  MAX_ROUNDS: 10,
  DEFAULT_ROUNDS: 5,
  APPROVAL_EXPIRY_HOURS: 48,
  NEGOTIATION_TIMEOUT_HOURS: 24,
  MAX_ACTIVE_NEGOTIATIONS_PER_BUYER: 5
};
