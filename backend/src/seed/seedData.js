import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Product from '../models/Product.js';
import SellerAgentConfig from '../models/SellerAgentConfig.js';
import Deal from '../models/Deal.js';
import Review from '../models/Review.js';
import Negotiation from '../models/Negotiation.js';
import Offer from '../models/Offer.js';
import Handover from '../models/Handover.js';

dotenv.config();

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/agentbazaar';
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected to MongoDB for seeding...');

    // Drop entire database to reset collections and old indexes cleanly
    await mongoose.connection.db.dropDatabase();
    console.log('[Seed] Dropped existing agentbazaar database.');

    // 1. Create Users (1 Admin + 3 Normal Users)
    const users = await User.create([
      {
        name: 'AgentBazaar Admin',
        email: 'admin@agentbazaar.com',
        password: 'password123',
        phone: '+91 99999 88888',
        city: 'New Delhi',
        photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
        bio: 'AgentBazaar Marketplace Platform Administrator & Moderator',
        role: 'ADMIN',
        status: 'ACTIVE',
        reputation: { averageRating: 5.0, totalReviews: 0, completedDeals: 0 }
      },
      {
        name: 'Murshad Ali',
        email: 'murshad@agentbazaar.com',
        password: 'password123',
        phone: '+91 98765 43210',
        city: 'Aligarh',
        photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        bio: 'MCA student at AMU. Selling pre-loved tech gadgets and study equipment in mint condition.',
        role: 'USER',
        status: 'ACTIVE',
        defaultStyle: 'BALANCED',
        defaultRounds: 5,
        reputation: { averageRating: 4.9, totalReviews: 8, completedDeals: 11 }
      },
      {
        name: 'Ayaan Khan',
        email: 'buyer@agentbazaar.com',
        password: 'password123',
        phone: '+91 91234 56789',
        city: 'New Delhi',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        bio: 'Software engineer looking for quality pre-owned gear. Prompt communicator and cash-ready buyer.',
        role: 'USER',
        status: 'ACTIVE',
        defaultStyle: 'FIRM',
        defaultRounds: 5,
        reputation: { averageRating: 4.8, totalReviews: 5, completedDeals: 7 }
      },
      {
        name: 'Farhan Zaidi',
        email: 'reseller@agentbazaar.com',
        password: 'password123',
        phone: '+91 99887 76655',
        city: 'Lucknow',
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
        bio: 'Verified refurbished electronics trader with over 5 years of verified peer-to-peer sales.',
        role: 'USER',
        status: 'ACTIVE',
        defaultStyle: 'FLEXIBLE',
        defaultRounds: 5,
        reputation: { averageRating: 5.0, totalReviews: 14, completedDeals: 22 }
      }
    ]);

    const admin = users[0];
    const murshad = users[1];
    const ayaan = users[2];
    const farhan = users[3];

    // 2. Create 8+ Diverse Products across categories
    const products = await Product.create([
      {
        sellerId: murshad._id,
        title: 'Apple MacBook Pro 14" M1 Pro (16GB RAM, 512GB SSD)',
        description: 'Space Gray MacBook Pro in like-new condition. Battery health 93% with 110 cycle count. Original MagSafe charger, box, and bill included. No scratches or dents. Kept in a hard-shell case.',
        price: 74000,
        condition: 'Like New',
        category: 'Computers',
        location: 'Civil Lines, Aligarh',
        images: [
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=1000&q=80'
        ],
        status: 'ACTIVE'
      },
      {
        sellerId: murshad._id,
        title: 'iPhone 14 (128GB, Blue) - Pristine Condition',
        description: 'Under 1.5 years old, always used with Spigen tempered glass and cover. Battery health 89%. Free extra case included. Clean IMEI, bill, and box available.',
        price: 45000,
        condition: 'Good',
        category: 'Mobiles',
        location: 'Medical Road, Aligarh',
        images: [
          'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=1000&q=80'
        ],
        status: 'ACTIVE'
      },
      {
        sellerId: farhan._id,
        title: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
        description: 'Flagship ANC headphones with 30-hour battery life. Black color, complete original carry case, aux cable, and USB-C wire. Pads sanitized.',
        price: 19500,
        condition: 'Like New',
        category: 'Electronics',
        location: 'Hazratganj, Lucknow',
        images: [
          'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1000&q=80'
        ],
        status: 'ACTIVE'
      },
      {
        sellerId: murshad._id,
        title: 'Canon EOS 200D II DSLR Camera with 18-55mm IS STM Lens',
        description: '4K video recording, Dual Pixel CMOS AF, flip touchscreen. Perfect for vlogging, photography, and YouTube content. Includes 64GB SanDisk Extreme SD card and camera bag.',
        price: 36000,
        condition: 'Good',
        category: 'Electronics',
        location: 'Civil Lines, Aligarh',
        images: [
          'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=80'
        ],
        status: 'ACTIVE'
      },
      {
        sellerId: ayaan._id,
        title: 'Royal Enfield Classic 350 Reborn (Halcyon Black, 2022)',
        description: 'Single owner, only 8,200 km driven. Serviced exclusively at authorized service center. Comprehensive insurance valid. Smooth J-series engine.',
        price: 148000,
        condition: 'Good',
        category: 'Vehicles',
        location: 'Zakir Nagar, New Delhi',
        images: [
          'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1000&q=80'
        ],
        status: 'ACTIVE'
      },
      {
        sellerId: murshad._id,
        title: 'Ergonomic High-Back Mesh Desk Chair with Lumbar Support',
        description: 'Breathable Korean mesh, 3D adjustable armrests, multi-lock recline mechanism. Extremely comfortable for long hours of coding and study.',
        price: 6500,
        condition: 'Like New',
        category: 'Furniture',
        location: 'Dohrighat, Aligarh',
        images: [
          'https://images.unsplash.com/photo-1580481077195-c3a821a506cb?auto=format&fit=crop&w=1000&q=80'
        ],
        status: 'ACTIVE'
      },
      {
        sellerId: farhan._id,
        title: 'Trek Marlin 6 Mountain Bike (Size M/L, Shimano Deore 1x10)',
        description: 'Hydraulic disc brakes, lockout suspension fork. Lightly used on paved roads and university campus. Recently tuned up with new grips.',
        price: 26000,
        condition: 'Good',
        category: 'Books',
        location: 'Hazratganj, Lucknow',
        images: [
          'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1000&q=80'
        ],
        status: 'ACTIVE'
      },
      {
        sellerId: ayaan._id,
        title: 'Dell UltraSharp 27" 4K USB-C Monitor (U2723QE)',
        description: 'IPS Black technology with 2000:1 contrast ratio, 98% DCI-P3 color gamut, 90W USB-C power delivery hub. Original stand, HDMI, and USB-C cables.',
        price: 34000,
        condition: 'Like New',
        category: 'Computers',
        location: 'Connaught Place, New Delhi',
        images: [
          'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1000&q=80'
        ],
        status: 'ACTIVE'
      },
      {
        sellerId: farhan._id,
        title: 'LG 324L 3-Star Smart Inverter Frost-Free Double Door Refrigerator',
        description: 'Shiny steel finish, door cooling+, auto smart connect. Extremely energy efficient and in silent running condition. Only 1 year old.',
        price: 24500,
        condition: 'Good',
        category: 'Home Appliances',
        location: 'Gomti Nagar, Lucknow',
        images: [
          'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=1000&q=80'
        ],
        status: 'ACTIVE'
      }
    ]);

    // 3. Create Seller Agent Configurations for eligible products
    await SellerAgentConfig.create([
      {
        productId: products[0]._id, // MacBook Pro 14"
        openingAsk: 72000,
        privateMinPrice: 65000,
        style: 'BALANCED',
        maxRounds: 5
      },
      {
        productId: products[1]._id, // iPhone 14
        openingAsk: 44000,
        privateMinPrice: 38500,
        style: 'FIRM',
        maxRounds: 5
      },
      {
        productId: products[2]._id, // Sony Headphones
        openingAsk: 19000,
        privateMinPrice: 16000,
        style: 'BALANCED',
        maxRounds: 4
      },
      {
        productId: products[3]._id, // Canon Camera
        openingAsk: 35000,
        privateMinPrice: 30000,
        style: 'BALANCED',
        maxRounds: 5
      },
      {
        productId: products[4]._id, // Royal Enfield
        openingAsk: 145000,
        privateMinPrice: 132000,
        style: 'FIRM',
        maxRounds: 5
      },
      {
        productId: products[5]._id, // Chair
        openingAsk: 6200,
        privateMinPrice: 4800,
        style: 'FLEXIBLE',
        maxRounds: 4
      },
      {
        productId: products[6]._id, // Bike
        openingAsk: 25000,
        privateMinPrice: 21000,
        style: 'BALANCED',
        maxRounds: 5
      },
      {
        productId: products[7]._id, // Dell Monitor
        openingAsk: 33000,
        privateMinPrice: 28000,
        style: 'BALANCED',
        maxRounds: 5
      },
      {
        productId: products[8]._id, // Refrigerator
        openingAsk: 23500,
        privateMinPrice: 19000,
        style: 'FLEXIBLE',
        maxRounds: 4
      }
    ]);

    console.log(`[Seed] Seeded ${users.length} users, ${products.length} products, and 9 SellerAgentConfigs.`);
    console.log('Demo Credentials:');
    console.log('  Admin:   admin@agentbazaar.com / password123');
    console.log('  Buyer:   buyer@agentbazaar.com / password123');
    console.log('  Seller:  murshad@agentbazaar.com / password123');
    console.log('  Trader:  reseller@agentbazaar.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error during seeding:', error);
    process.exit(1);
  }
};

seedDB();
