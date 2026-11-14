import { validateAndGuardrailAction } from '../ai/guardrailService.js';
import { calculateConcessionMove } from '../ai/concessionService.js';
import { parseGeminiResponse } from '../ai/responseParser.js';
import { buildBuyerAgentPrompt, buildSellerAgentPrompt } from '../ai/promptBuilder.js';
import { CONCESSION_CONSTANTS, SYSTEM_LIMITS } from '../ai/concessionConfig.js';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Product from '../models/Product.js';
import SellerAgentConfig from '../models/SellerAgentConfig.js';
import Negotiation from '../models/Negotiation.js';
import Offer from '../models/Offer.js';
import Deal from '../models/Deal.js';
import Handover from '../models/Handover.js';
import Review from '../models/Review.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log('\n==================================================');
  console.log('   AGENTBAZAAR COMPREHENSIVE TEST SUITE');
  console.log('==================================================\n');

  // -----------------------------------------------------------------
  // 1. SYSTEM CONFIG & CONCESSION TESTS
  // -----------------------------------------------------------------
  console.log('Test Group 1: Concession Configuration & Limits');
  assert(CONCESSION_CONSTANTS.FIRM.beta > CONCESSION_CONSTANTS.BALANCED.beta, 'FIRM strategy has higher beta than BALANCED (concedes slower)');
  assert(CONCESSION_CONSTANTS.FLEXIBLE.beta < CONCESSION_CONSTANTS.BALANCED.beta, 'FLEXIBLE strategy has lower beta than BALANCED (concedes faster)');
  assert(SYSTEM_LIMITS.APPROVAL_EXPIRY_HOURS === 48, 'Deal approval window is configured to 48 hours');
  assert(SYSTEM_LIMITS.MAX_ACTIVE_NEGOTIATIONS_PER_BUYER === 5, 'Max 5 active negotiations limit per buyer configured');

  // -----------------------------------------------------------------
  // 2. MATHEMATICAL CONCESSION FORMULA TESTS
  // -----------------------------------------------------------------
  console.log('\nTest Group 2: Mathematical Concession Engine');
  const mockProduct = {
    title: 'Apple MacBook Pro 14"',
    condition: 'Like New',
    price: 20000,
    category: 'Computers',
    location: 'Aligarh'
  };

  // Buyer round 1 concession: starts near target
  const buyerMoveR1 = calculateConcessionMove({
    actor: 'BUYER_AGENT',
    product: mockProduct,
    privateConfig: { targetPrice: 15000, budgetCeiling: 18000, style: 'BALANCED' },
    currentRound: 1,
    maxRounds: 5,
    offerHistory: []
  });
  assert(buyerMoveR1.action === 'OFFER', 'Buyer round 1 generates an OFFER');
  assert(buyerMoveR1.price === 15000, 'Buyer round 1 opening offer starts at target price (₹15,000)');

  // Buyer round 5 concession: reaches budget ceiling
  const buyerMoveR5 = calculateConcessionMove({
    actor: 'BUYER_AGENT',
    product: mockProduct,
    privateConfig: { targetPrice: 15000, budgetCeiling: 18000, style: 'BALANCED' },
    currentRound: 5,
    maxRounds: 5,
    offerHistory: []
  });
  assert(buyerMoveR5.price === 18000, 'Buyer round 5 offer reaches budget ceiling (₹18,000)');
  assert(buyerMoveR5.price <= 18000, 'Buyer offer never exceeds budget ceiling');

  // Seller round 1 concession: starts at opening ask
  const sellerMoveR1 = calculateConcessionMove({
    actor: 'SELLER_AGENT',
    product: mockProduct,
    privateConfig: { openingAsk: 19000, privateMinPrice: 16000, style: 'BALANCED' },
    currentRound: 1,
    maxRounds: 5,
    offerHistory: [{ actor: 'BUYER_AGENT', price: 15000, action: 'OFFER' }]
  });
  assert(sellerMoveR1.action === 'OFFER', 'Seller round 1 generates an OFFER');
  assert(sellerMoveR1.price === 19000, 'Seller round 1 starts at opening ask (₹19,000)');

  // Seller round 5 concession: converges to floor
  const sellerMoveR5 = calculateConcessionMove({
    actor: 'SELLER_AGENT',
    product: mockProduct,
    privateConfig: { openingAsk: 19000, privateMinPrice: 16000, style: 'BALANCED' },
    currentRound: 5,
    maxRounds: 5,
    offerHistory: [{ actor: 'BUYER_AGENT', price: 15000, action: 'OFFER' }]
  });
  assert(sellerMoveR5.price === 16000, 'Seller final round moves to private minimum floor (₹16,000)');
  assert(sellerMoveR5.price >= 16000, 'Seller ask never drops below private floor');

  // -----------------------------------------------------------------
  // 3. AI GUARDRAILS & BOUNDARY ENFORCEMENT
  // -----------------------------------------------------------------
  console.log('\nTest Group 3: Programmatic Guardrail Validation (NFR2)');

  // 3.1 Limit check: Clamping over-budget buyer offer
  const overCeilingMove = validateAndGuardrailAction({
    rawAction: { action: 'OFFER', price: 21000, message: 'I offer 21k' },
    actor: 'BUYER_AGENT',
    product: mockProduct,
    privateConfig: { targetPrice: 15000, budgetCeiling: 18000, style: 'BALANCED' },
    currentRound: 2,
    maxRounds: 5,
    offerHistory: [{ actor: 'BUYER_AGENT', price: 15000, action: 'OFFER' }]
  });
  assert(overCeilingMove.price === 18000, 'Guardrail clamps buyer offer > budget ceiling to ₹18,000');
  assert(overCeilingMove.guardrailCorrected === true, 'Guardrail records intervention flag');

  // 3.2 Limit check: Clamping under-floor seller ask
  const underFloorMove = validateAndGuardrailAction({
    rawAction: { action: 'OFFER', price: 13500, message: 'Letting it go for 13.5k' },
    actor: 'SELLER_AGENT',
    product: mockProduct,
    privateConfig: { openingAsk: 19000, privateMinPrice: 16000, style: 'BALANCED' },
    currentRound: 2,
    maxRounds: 5,
    offerHistory: [{ actor: 'BUYER_AGENT', price: 15000, action: 'OFFER' }]
  });
  assert(underFloorMove.price === 16000, 'Guardrail clamps seller ask < floor price to ₹16,000');
  assert(underFloorMove.guardrailCorrected === true, 'Guardrail records intervention flag for floor clamp');

  // 3.3 Direction check: Buyer cannot make a lower counter-offer than previous offer
  const backwardBuyer = validateAndGuardrailAction({
    rawAction: { action: 'OFFER', price: 15500, message: 'Lowered my offer' },
    actor: 'BUYER_AGENT',
    product: mockProduct,
    privateConfig: { targetPrice: 15000, budgetCeiling: 18000, style: 'BALANCED' },
    currentRound: 3,
    maxRounds: 5,
    offerHistory: [
      { actor: 'BUYER_AGENT', price: 16500, action: 'OFFER' },
      { actor: 'SELLER_AGENT', price: 18500, action: 'OFFER' }
    ]
  });
  assert(backwardBuyer.price === 16500, 'Direction check: Buyer offer prevented from backtracking');

  // 3.4 Direction check: Seller cannot raise ask after conceding
  const backwardSeller = validateAndGuardrailAction({
    rawAction: { action: 'OFFER', price: 19500, message: 'Raising my price' },
    actor: 'SELLER_AGENT',
    product: mockProduct,
    privateConfig: { openingAsk: 19000, privateMinPrice: 16000, style: 'BALANCED' },
    currentRound: 3,
    maxRounds: 5,
    offerHistory: [
      { actor: 'BUYER_AGENT', price: 15000, action: 'OFFER' },
      { actor: 'SELLER_AGENT', price: 18000, action: 'OFFER' },
      { actor: 'BUYER_AGENT', price: 16000, action: 'OFFER' }
    ]
  });
  assert(backwardSeller.price === 18000, 'Direction check: Seller ask prevented from moving upward');

  // 3.5 Crossing check: Buyer offer >= seller ask converts to ACCEPT
  const crossingBuyer = validateAndGuardrailAction({
    rawAction: { action: 'OFFER', price: 17500, message: 'I offer 17.5k' },
    actor: 'BUYER_AGENT',
    product: mockProduct,
    privateConfig: { targetPrice: 15000, budgetCeiling: 18000, style: 'BALANCED' },
    currentRound: 2,
    maxRounds: 5,
    offerHistory: [
      { actor: 'BUYER_AGENT', price: 15000, action: 'OFFER' },
      { actor: 'SELLER_AGENT', price: 17000, action: 'OFFER' }
    ]
  });
  assert(crossingBuyer.action === 'ACCEPT', 'Crossing check: Buyer offer >= seller ask converts to ACCEPT');
  assert(crossingBuyer.price === 17000, 'Crossing check: Clamps to standing seller ask');

  // 3.6 Privacy check: Redact message if AI leaks private limits
  const privacyLeakingMove = validateAndGuardrailAction({
    rawAction: { action: 'OFFER', price: 16000, message: 'My private floor is 16000 and budget is high' },
    actor: 'SELLER_AGENT',
    product: mockProduct,
    privateConfig: { openingAsk: 19000, privateMinPrice: 16000, style: 'BALANCED' },
    currentRound: 1,
    maxRounds: 5,
    offerHistory: [{ actor: 'BUYER_AGENT', price: 15000, action: 'OFFER' }]
  });
  assert(!privacyLeakingMove.message.includes('16000'), 'Message privacy check: Leaked private limit redacted from chat message');

  // 3.7 Protocol check: Only OFFER, ACCEPT, REJECT allowed; others fall back safely
  const invalidActionMove = validateAndGuardrailAction({
    rawAction: { action: 'COUNTER_PROPOSAL_DISCOUNT', price: 16000, message: 'Invalid action' },
    actor: 'BUYER_AGENT',
    product: mockProduct,
    privateConfig: { targetPrice: 15000, budgetCeiling: 18000, style: 'BALANCED' },
    currentRound: 1,
    maxRounds: 5,
    offerHistory: []
  });
  assert(invalidActionMove.action === 'OFFER', 'Invalid action type safely converted to valid rule-based OFFER');

  // -----------------------------------------------------------------
  // 4. GEMINI PROMPT PRIVACY ISOLATION TESTS
  // -----------------------------------------------------------------
  console.log('\nTest Group 4: Gemini Prompt Confidentiality (NFR1)');

  const buyerPrompt = buildBuyerAgentPrompt({
    product: mockProduct,
    buyerConfig: { targetPrice: 15000, budgetCeiling: 18000, style: 'BALANCED' },
    currentRound: 1,
    maxRounds: 5,
    offerHistory: []
  });
  assert(buyerPrompt.includes('18000'), 'Buyer prompt includes buyer ceiling');
  assert(!buyerPrompt.includes('16000') && !buyerPrompt.includes('floorPrice') && !buyerPrompt.includes('privateMinPrice'), 'Buyer prompt NEVER reveals seller floor price');

  const sellerPrompt = buildSellerAgentPrompt({
    product: mockProduct,
    sellerConfig: { openingAsk: 19000, privateMinPrice: 16000, style: 'BALANCED' },
    currentRound: 2,
    maxRounds: 5,
    offerHistory: [{ actor: 'BUYER_AGENT', price: 15000, action: 'OFFER', message: 'Hello' }]
  });
  assert(sellerPrompt.includes('16000'), 'Seller prompt includes seller floor');
  assert(!sellerPrompt.includes('18000') && !sellerPrompt.includes('budgetCeiling'), 'Seller prompt NEVER reveals buyer budget ceiling');

  // -----------------------------------------------------------------
  // 5. RESPONSE PARSER RESILIENCE TESTS
  // -----------------------------------------------------------------
  console.log('\nTest Group 5: AI Response Parser');

  const cleanJson = '{"action": "OFFER", "price": 17000, "message": "I offer 17000"}';
  const parsedClean = parseGeminiResponse(cleanJson);
  assert(parsedClean.action === 'OFFER' && parsedClean.price === 17000, 'Standard JSON parsed correctly');

  const fencedJson = '```json\n{"action": "ACCEPT", "price": 16500, "message": "Agreed"}\n```';
  const parsedFenced = parseGeminiResponse(fencedJson);
  assert(parsedFenced.action === 'ACCEPT' && parsedFenced.price === 16500, 'Markdown fenced JSON parsed correctly');

  const proseSurrounded = 'Here is my strategic thought:\n{"action": "REJECT", "price": null, "message": "No deal"}\nThanks!';
  const parsedProse = parseGeminiResponse(proseSurrounded);
  assert(parsedProse.action === 'REJECT', 'Prose-surrounded JSON extracted and parsed correctly');

  // -----------------------------------------------------------------
  // 6. MONGOOSE SCHEMA DEFINITION INTEGRITY
  // -----------------------------------------------------------------
  console.log('\nTest Group 6: Mongoose Model Schema Verification');

  assert(User.schema.path('role').enumValues.includes('ADMIN'), 'User schema includes ADMIN role');
  assert(User.schema.path('status').enumValues.includes('DEACTIVATED'), 'User schema includes DEACTIVATED status');
  assert(Product.schema.path('status').enumValues.includes('RESERVED'), 'Product schema includes RESERVED status');
  assert(Product.schema.path('status').enumValues.includes('SOLD'), 'Product schema includes SOLD status');
  assert(SellerAgentConfig.schema.path('openingAsk') !== undefined, 'SellerAgentConfig schema has openingAsk field');
  assert(Offer.schema.path('guardrailCorrected') !== undefined, 'Offer schema has guardrailCorrected field');
  assert(Deal.schema.path('buyerApproval.status').enumValues.includes('APPROVED'), 'Deal schema has buyerApproval status');
  assert(Deal.schema.path('sellerApproval.status').enumValues.includes('APPROVED'), 'Deal schema has sellerApproval status');
  assert(Handover.schema.path('dealId') !== undefined, 'Handover schema has dealId reference');
  assert(Review.schema.path('flagged') !== undefined, 'Review schema has flagged field');

  // -----------------------------------------------------------------
  // 7. REAL-WORLD HUMAN RECIPROCITY & AXELROD TIT-FOR-TAT
  // -----------------------------------------------------------------
  console.log('\nTest Group 7: Real-World Human Reciprocal Negotiation (Axelrod & Harvard Model)');

  // 7.1 Concession Reciprocity: When seller concedes ₹1,000, buyer reciprocates with higher offer
  const buyerReciprocalMove = calculateConcessionMove({
    actor: 'BUYER_AGENT',
    product: mockProduct,
    privateConfig: { targetPrice: 15000, budgetCeiling: 18000, style: 'BALANCED' },
    currentRound: 2,
    maxRounds: 5,
    offerHistory: [
      { round: 1, actor: 'BUYER_AGENT', price: 15000, action: 'OFFER' },
      { round: 1, actor: 'SELLER_AGENT', price: 19000, action: 'OFFER' }, // Conceded ₹1,000 from listed 20,000
    ]
  });
  assert(buyerReciprocalMove.price > 15000, 'Buyer reciprocates with increased offer when seller concedes');

  // 7.2 Unreciprocated Stubbornness Defense: When seller concedes ₹0, buyer holds ground
  const buyerHoldGroundMove = calculateConcessionMove({
    actor: 'BUYER_AGENT',
    product: mockProduct,
    privateConfig: { targetPrice: 15000, budgetCeiling: 18000, style: 'FIRM' },
    currentRound: 2,
    maxRounds: 5,
    offerHistory: [
      { round: 1, actor: 'BUYER_AGENT', price: 15000, action: 'OFFER' },
      { round: 1, actor: 'SELLER_AGENT', price: 20000, action: 'OFFER' }, // Conceded ₹0
    ]
  });
  assert(buyerHoldGroundMove.price === 15000, 'Buyer FIRM stance holds offer when opponent refuses to concede (₹0 step)');

  // 7.3 Closing Gap Auto-Agreement: When price gap is within tolerance, triggers ACCEPT
  const closingMove = calculateConcessionMove({
    actor: 'BUYER_AGENT',
    product: mockProduct,
    privateConfig: { targetPrice: 15000, budgetCeiling: 18000, style: 'BALANCED' },
    currentRound: 4,
    maxRounds: 5,
    offerHistory: [
      { round: 3, actor: 'BUYER_AGENT', price: 17200, action: 'OFFER' },
      { round: 3, actor: 'SELLER_AGENT', price: 17400, action: 'OFFER' }, // Gap is only ₹200 (<= 3%)
    ]
  });
  assert(closingMove.action === 'ACCEPT', 'Trivial price gap triggers deal ACCEPT instead of prolonging friction');

  // -----------------------------------------------------------------
  // TEST SUMMARY
  // -----------------------------------------------------------------
  console.log('\n==================================================');
  console.log(`TEST SUITE COMPLETED: ${passed} PASSED | ${failed} FAILED`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('[TestSuite] Unhandled Error:', err);
  process.exit(1);
});
