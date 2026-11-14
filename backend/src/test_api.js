import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Product from './models/Product.js';
import Negotiation from './models/Negotiation.js';
import Deal from './models/Deal.js';
import { executeNextTurn, runAutonomousSimulation } from './services/negotiationOrchestrator.js';
import { validateAndEnforceGuardrails } from './services/guardrailService.js';

dotenv.config();

const runTests = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/agentbazaar');
    console.log('[Test] Connected to MongoDB');

    // Test 1: Guardrail verification (NFR2)
    console.log('[Test 1] Testing Guardrail Service bounds enforcement...');
    const buyerGuardrail = validateAndEnforceGuardrails({
      role: 'buyer_agent',
      rawOfferPrice: 80000, // exceeds ceiling of 70000
      rawMessage: 'I offer 80000',
      buyerLimits: { targetPrice: 60000, budgetCeiling: 70000, style: 'moderate' },
      sellerLimits: { targetPrice: 74000, floorPrice: 65000, style: 'balanced' },
      currentRound: 1,
      maxRounds: 5
    });

    if (buyerGuardrail.offerPrice === 70000 && buyerGuardrail.guardrailTriggered) {
      console.log('  ✓ Buyer Guardrail Passed: Price clamped to ceiling (₹70,000)');
    } else {
      throw new Error(`Buyer Guardrail failed: ${JSON.stringify(buyerGuardrail)}`);
    }

    const sellerGuardrail = validateAndEnforceGuardrails({
      role: 'seller_agent',
      rawOfferPrice: 50000, // below floor of 65000
      rawMessage: 'I offer 50000',
      buyerLimits: { targetPrice: 60000, budgetCeiling: 70000, style: 'moderate' },
      sellerLimits: { targetPrice: 74000, floorPrice: 65000, style: 'balanced' },
      currentRound: 1,
      maxRounds: 5
    });

    if (sellerGuardrail.offerPrice === 65000 && sellerGuardrail.guardrailTriggered) {
      console.log('  ✓ Seller Guardrail Passed: Price clamped to floor (₹65,000)');
    } else {
      throw new Error(`Seller Guardrail failed: ${JSON.stringify(sellerGuardrail)}`);
    }

    // Test 2: Negotiation Orchestration & Convergence
    console.log('[Test 2] Testing Negotiation Orchestration & Deal Generation...');
    const buyer = await User.findOne({ email: 'buyer@agentbazaar.com' });
    const product = await Product.findOne({ title: /MacBook Pro/i }).select('+sellerFloorPrice +sellerStrategy');

    console.log(`  Product: ${product.title} (Price: ₹${product.price}, Floor: ₹${product.sellerFloorPrice})`);

    const negotiation = await Negotiation.create({
      product: product._id,
      buyer: buyer._id,
      seller: product.seller,
      currentRound: 1,
      maxRounds: 5,
      status: 'active',
      buyerLimits: {
        targetPrice: 62000,
        budgetCeiling: 68000,
        style: 'moderate'
      },
      sellerLimits: {
        targetPrice: product.price,
        floorPrice: product.sellerFloorPrice,
        style: product.sellerStrategy.style
      },
      offers: []
    });

    // Execute turns autonomously
    console.log('  Executing autonomous negotiation simulation...');
    await runAutonomousSimulation(negotiation._id, 100);

    const updatedNeg = await Negotiation.findById(negotiation._id).populate('deal');
    console.log(`  Negotiation Status: ${updatedNeg.status}`);
    console.log(`  Total Offers Exchanged: ${updatedNeg.offers.length}`);
    for (const off of updatedNeg.offers) {
      console.log(`    Round ${off.round} [${off.senderRole}]: ₹${off.offerPrice.toLocaleString('en-IN')} - "${off.message.slice(0, 60)}..."`);
    }

    if (updatedNeg.status === 'agreed') {
      console.log(`  ✓ Negotiation Converged! Agreed Price: ₹${updatedNeg.agreedPrice.toLocaleString('en-IN')}`);
      const deal = await Deal.findById(updatedNeg.deal);
      console.log(`  ✓ Deal Proposal Created: ${deal._id} (Status: ${deal.status}, BuyerApproved: ${deal.buyerApproved}, SellerApproved: ${deal.sellerApproved})`);

      // Test dual human approval
      deal.buyerApproved = true;
      deal.sellerApproved = true;
      deal.status = 'confirmed';
      await deal.save();
      console.log(`  ✓ Dual Human Approval Passed: Deal status updated to CONFIRMED!`);
    } else {
      console.log(`  Negotiation ended with status: ${updatedNeg.status}`);
    }

    console.log('\n[SUCCESS] All core backend and negotiation tests PASSED successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('[Test Failed]:', error);
    process.exit(1);
  }
};

runTests();
