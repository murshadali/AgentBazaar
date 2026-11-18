import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Product from '../models/Product.js';
import SellerAgentConfig from '../models/SellerAgentConfig.js';

dotenv.config();

const usersData = [
  {
    name: 'Farhan Khan',
    email: 'farhan@agentbazaar.com',
    password: 'password123',
    phone: '+91 98371 22334',
    city: 'Aligarh',
    bio: 'AMU student selling pre-owned electronics, study furniture, and books in good working condition.',
    role: 'USER',
    status: 'ACTIVE',
    defaultStyle: 'BALANCED',
    defaultRounds: 5,
    reputation: { averageRating: 4.8, totalReviews: 5, completedDeals: 7 }
  },
  {
    name: 'Kasim Ali',
    email: 'kasim@agentbazaar.com',
    password: 'password123',
    phone: '+91 94120 55667',
    city: 'Moradabad',
    bio: 'Local resident & cycling enthusiast from Moradabad. Dealing in second-hand home appliances and cycles.',
    role: 'USER',
    status: 'ACTIVE',
    defaultStyle: 'BALANCED',
    defaultRounds: 5,
    reputation: { averageRating: 4.9, totalReviews: 6, completedDeals: 9 }
  },
  {
    name: 'Sumit',
    email: 'sumit@agentbazaar.com',
    password: 'password123',
    phone: '+91 97580 88990',
    city: 'Moradabad',
    bio: 'Avid reader & tech hobbyist. Selling well-maintained audio gear, pre-loved ereaders and gadgets.',
    role: 'USER',
    status: 'ACTIVE',
    defaultStyle: 'FIRM',
    defaultRounds: 5,
    reputation: { averageRating: 5.0, totalReviews: 4, completedDeals: 6 }
  }
];

// 6 Authentic Used / Pre-owned products with real second-hand photography
const productsData = [
  // FARHAN KHAN (Aligarh)
  {
    userEmail: 'farhan@agentbazaar.com',
    product: {
      title: 'Vintage Solid Teak Wood Study Table with 3 Drawers',
      description: 'Pre-owned solid teak wood study table in sturdy condition. Used for 3 years during college. Natural wood grain with slight surface patina on top which gives it an authentic vintage look. No termite or wobbling. Includes 3 functional smooth-sliding drawers with vintage brass handles. Ideal for students, remote work setup or reading nook.',
      category: 'Furniture',
      condition: 'Used',
      price: 2800,
      location: 'Medical College Road, Aligarh',
      images: [
        'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1000&q=80'
      ],
      status: 'ACTIVE'
    },
    agent: {
      openingAsk: 2800,
      privateMinPrice: 2200,
      style: 'BALANCED',
      maxRounds: 5
    }
  },
  {
    userEmail: 'farhan@agentbazaar.com',
    product: {
      title: 'Mi Dual-Band Gigabit AC1200 Wi-Fi Router (Used 10 Months)',
      description: 'Selling my pre-owned Xiaomi Mi AC1200 Dual-Band Gigabit Router. Upgraded to mesh Wi-Fi so no longer needed. 4 high-gain omnidirectional external antennas, supports up to 1167 Mbps speeds (300 Mbps on 2.4GHz + 867 Mbps on 5GHz). Minor superficial scuffs from desk use, but 100% stable performance and zero packet drop. Comes with original 12V power adapter and Cat-6 Ethernet cable.',
      category: 'Electronics',
      condition: 'Good',
      price: 950,
      location: 'Jamalpur Bypass, Aligarh',
      images: [
        'https://images.unsplash.com/photo-1606904825846-647eb07f5be2?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1000&q=80'
      ],
      status: 'ACTIVE'
    },
    agent: {
      openingAsk: 950,
      privateMinPrice: 750,
      style: 'FLEXIBLE',
      maxRounds: 5
    }
  },

  // KASIM ALI (Moradabad)
  {
    userEmail: 'kasim@agentbazaar.com',
    product: {
      title: 'Hero Sprint 26T 21-Speed Mountain Bicycle with Dual Disc Brakes',
      description: 'Used Hero Sprint 26T MTB bicycle. Owned for around 1.5 years for weekend cycling around Ramganga river. Dual mechanical disc brakes for crisp stopping power, front suspension fork, and 21-speed Shimano Tourney thumb shifters. Chain and cassette recently lubricated. Mild wear on pedals and frame decals as expected from honest road usage. Comes with side kickstand and mudguards.',
      category: 'Vehicles',
      condition: 'Used',
      price: 3400,
      location: 'Civil Lines, Moradabad',
      images: [
        'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&w=1000&q=80'
      ],
      status: 'ACTIVE'
    },
    agent: {
      openingAsk: 3400,
      privateMinPrice: 2600,
      style: 'BALANCED',
      maxRounds: 5
    }
  },
  {
    userEmail: 'kasim@agentbazaar.com',
    product: {
      title: 'Bajaj 15L Storage Water Heater Geyser (Fully Serviced)',
      description: 'Second-hand Bajaj 15-litre electric storage geyser. Stainless steel inner tank with Glassline coating, fully descaled and serviced with a new heating element before listing. Exterior has slight age discoloration on plastic casing, but heats water to 75°C in under 12 minutes. Selling due to bathroom remodeling with central solar unit. Safe in-person handover in Moradabad.',
      category: 'Home Appliances',
      condition: 'Good',
      price: 2450,
      location: 'Brass Market, Peetal Basti, Moradabad',
      images: [
        'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1000&q=80'
      ],
      status: 'ACTIVE'
    },
    agent: {
      openingAsk: 2450,
      privateMinPrice: 2000,
      style: 'FIRM',
      maxRounds: 5
    }
  },

  // SUMIT (Aligarh / Moradabad)
  {
    userEmail: 'sumit@agentbazaar.com',
    product: {
      title: 'Boat Stone 650 10W Portable Bluetooth Speaker (Rugged Edition)',
      description: 'Well-cared pre-owned Boat Stone 650 wireless speaker with 10W RMS dual drivers and passive subwoofer radiator. IPX5 water/sweat resistant diamond-mesh silicone finish. Battery holds ~6 hours playback at 70% volume. Grill has minor paint rub on the edges from backpack carry. Bluetooth 5.0 connects instantly. Original micro-USB charging cable included.',
      category: 'Electronics',
      condition: 'Good',
      price: 1100,
      location: 'Dodhpur near University Gate 3, Aligarh',
      images: [
        'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=1000&q=80'
      ],
      status: 'ACTIVE'
    },
    agent: {
      openingAsk: 1100,
      privateMinPrice: 850,
      style: 'BALANCED',
      maxRounds: 5
    }
  },
  {
    userEmail: 'sumit@agentbazaar.com',
    product: {
      title: 'Amazon Kindle Paperwhite 10th Gen (8GB, 300 PPI, Backlight)',
      description: 'Second-hand Kindle Paperwhite 10th Gen (Waterproof IPX8 edition) with 8GB storage and built-in adjustable 5-LED reading light. Glare-free 300 ppi e-ink display reads like real paper in sunlight. Back shell has gentle hand grip sheen. Battery easily lasts 3 to 4 weeks on a single charge. Deregistered from Amazon account and ready for new owner. Includes magnetic sleep-wake cover.',
      category: 'Books',
      condition: 'Like New',
      price: 4200,
      location: 'Rambagh Road, Moradabad',
      images: [
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1000&q=80'
      ],
      status: 'ACTIVE'
    },
    agent: {
      openingAsk: 4200,
      privateMinPrice: 3600,
      style: 'FIRM',
      maxRounds: 5
    }
  }
];

async function runSeed() {
  try {
    console.log('[Custom Seed] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Custom Seed] Connected!');

    // 1. Create or update users
    const userMap = {};
    for (const u of usersData) {
      let existing = await User.findOne({ email: u.email });
      if (!existing) {
        existing = await User.create(u);
        console.log(`[Custom Seed] Created user: ${existing.name} (${existing.email})`);
      } else {
        existing.name = u.name;
        existing.city = u.city;
        existing.phone = u.phone;
        existing.bio = u.bio;
        existing.role = u.role;
        existing.status = u.status;
        existing.password = u.password; // Pre-save hook will hash it
        await existing.save();
        console.log(`[Custom Seed] Updated existing user: ${existing.name} (${existing.email})`);
      }
      userMap[u.email] = existing;
    }

    // 2. Insert products and seller agents
    for (const item of productsData) {
      const seller = userMap[item.userEmail];
      if (!seller) continue;

      let product = await Product.findOne({
        sellerId: seller._id,
        title: item.product.title
      });

      if (!product) {
        product = await Product.create({
          ...item.product,
          sellerId: seller._id
        });
        console.log(`[Custom Seed] Created product: "${product.title}" by ${seller.name} in ${product.location}`);
      } else {
        product.price = item.product.price;
        product.condition = item.product.condition;
        product.description = item.product.description;
        product.images = item.product.images;
        product.location = item.product.location;
        product.status = 'ACTIVE';
        await product.save();
        console.log(`[Custom Seed] Updated product: "${product.title}"`);
      }

      // Configure AI Seller Agent
      let config = await SellerAgentConfig.findOne({ productId: product._id });
      if (!config) {
        config = await SellerAgentConfig.create({
          productId: product._id,
          openingAsk: item.agent.openingAsk,
          privateMinPrice: item.agent.privateMinPrice,
          style: item.agent.style,
          maxRounds: item.agent.maxRounds
        });
        console.log(`[Custom Seed] Configured AI Agent for "${product.title}" (${item.agent.style} style, Floor: ₹${item.agent.privateMinPrice})`);
      } else {
        config.openingAsk = item.agent.openingAsk;
        config.privateMinPrice = item.agent.privateMinPrice;
        config.style = item.agent.style;
        config.maxRounds = item.agent.maxRounds;
        await config.save();
        console.log(`[Custom Seed] Updated AI Agent for "${product.title}"`);
      }
    }

    console.log('[Custom Seed] All users, authentic used products, and AI Seller Agents seeded successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[Custom Seed] Failed:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

runSeed();
