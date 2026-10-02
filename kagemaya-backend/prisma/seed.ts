import { PrismaClient, Role, DiscountType, PointTransactionType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (Clean slate)
  await prisma.transactionItem.deleteMany();
  await prisma.review.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.pointTransaction.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.voucher.deleteMany();
  await prisma.ticketType.deleteMany();
  await prisma.eventDiscussion.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.event.deleteMany();
  await prisma.category.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.organizerProfile.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // 1. SEED CATEGORIES
  console.log('📦 Seeding Categories...');
  const cat4D = await prisma.category.create({
    data: { name: 'Film 4D', slug: 'film-4d' },
  });
  const catWorkshop = await prisma.category.create({
    data: { name: 'Workshop Kreatif', slug: 'workshop-kreatif' },
  });
  const catTalkshow = await prisma.category.create({
    data: { name: 'Talkshow Budaya', slug: 'talkshow-budaya' },
  });
  const catAnime = await prisma.category.create({
    data: { name: 'Anime & Manga', slug: 'anime-dan-manga' },
  });

  // 2. SEED ORGANIZERS
  console.log('👤 Seeding Organizers...');
  const orgUser1 = await prisma.user.create({
    data: {
      name: 'Aozora Cinema Collective',
      email: 'organizer@aozora.id',
      password: hashedPassword,
      role: Role.ORGANIZER,
      referral_code: 'AOZORA01',
      organizer_profile: {
        create: {
          organization_name: 'Aozora Collective',
          bio: 'Kolektif independen pemutaran film 4D dan kolaborasi sinema Indo-Jepang.',
        },
      },
    },
  });

  const orgUser2 = await prisma.user.create({
    data: {
      name: 'Nippon Kai Cinema',
      email: 'contact@nipponkai.jp',
      password: hashedPassword,
      role: Role.ORGANIZER,
      referral_code: 'NIPPON01',
      organizer_profile: {
        create: {
          organization_name: 'Nippon Kai Productions',
          bio: 'Penyelenggara festival film & pertunjukan teknologi sinema interaktif.',
        },
      },
    },
  });

  // 3. SEED CUSTOMERS (Dengan Skenario Referral)
  console.log('👥 Seeding Registered Customers & Referrals...');
  // Customer 1 (Pemberi Referral)
  const custBudi = await prisma.user.create({
    data: {
      name: 'Budi Santoso',
      email: 'budi@gmail.com',
      password: hashedPassword,
      role: Role.CUSTOMER,
      referral_code: 'BUDI1234',
    },
  });

  // Customer 2 (Daftar menggunakan kode Budi -> Dapat Kupon + Budi dapat 10.000 Poin)
  const custRina = await prisma.user.create({
    data: {
      name: 'Rina Penikmat Film',
      email: 'rina@gmail.com',
      password: hashedPassword,
      role: Role.CUSTOMER,
      referral_code: 'RINA5678',
      referred_by_id: custBudi.id,
    },
  });

  // 4. SEED REWARDS (Point & Kupon Referral)
  console.log('🎁 Seeding Points & Referral Coupons...');
  const expiresAt3Months = new Date();
  expiresAt3Months.setMonth(expiresAt3Months.getMonth() + 3);

  // Budi dapat +10.000 Poin karena Rina mendaftar pakai kodenya
  await prisma.pointTransaction.create({
    data: {
      user_id: custBudi.id,
      amount: 10000,
      remaining_amount: 10000,
      type: PointTransactionType.EARN,
      expires_at: expiresAt3Months,
    },
  });

  // Rina dapat Kupon Diskon Registrasi Referral
  await prisma.coupon.create({
    data: {
      user_id: custRina.id,
      discount_amount: 25000,
      expires_at: expiresAt3Months,
      is_used: false,
    },
  });

  // 5. SEED EVENTS, TICKET TYPES & VOUCHERS
  console.log('🎬 Seeding Events & Vouchers...');
  const event1 = await prisma.event.create({
    data: {
      organizer_id: orgUser1.id,
      category_id: cat4D.id,
      title: 'Yūgen: Film 4D Kolaborasi Tokyo–Jakarta',
      description: 'Pemutaran sinematik 4D efek fisik penuh dengan aroma, angin, dan pergerakan kursi sinematik.',
      city: 'Jakarta',
      location: 'CGV Grand Indonesia 4DX Hall',
      banner_url: 'https://placehold.co/800x400/1a1a2e/e94560?text=Yugen+4D+Film',
      start_date: new Date(Date.now() + 86400000 * 7), // 7 hari dari sekarang
      end_date: new Date(Date.now() + 86400000 * 7 + 10800000),
      available_seats: 100, // Matching total quota tiket
      ticket_types: {
        create: [
          { name: 'Regular 4D', price: 120000, quota: 60, available_quota: 60 },
          { name: 'VIP Motion Experience', price: 200000, quota: 40, available_quota: 40 },
        ],
      },
      vouchers: {
        create: [
          {
            code: 'AOZORA10',
            discount_type: DiscountType.PERCENT,
            discount_value: 10,
            start_date: new Date(),
            end_date: new Date(Date.now() + 86400000 * 30),
          },
        ],
      },
    },
  });

  const event2 = await prisma.event.create({
    data: {
      organizer_id: orgUser2.id,
      category_id: catWorkshop.id,
      title: 'Workshop Foley & Sound Effect ala Anime 4D',
      description: 'Pelajari teknik pembuatan efek suara nyata yang dipakai pada produksi film sinema Jepang.',
      city: 'Bandung',
      location: 'Bandung Creative Hub Room 3',
      banner_url: 'https://placehold.co/800x400/16213e/0f3460?text=Workshop+Foley+Anime',
      start_date: new Date(Date.now() + 86400000 * 14),
      end_date: new Date(Date.now() + 86400000 * 14 + 18000000),
      available_seats: 30,
      ticket_types: {
        create: [
          { name: 'Early Bird', price: 75000, quota: 10, available_quota: 10 },
          { name: 'General Pass', price: 100000, quota: 20, available_quota: 20 },
        ],
      },
    },
  });

  // 6. SEED SOCIAL INTERACTIONS (Wishlist, Follow, Q&A)
  console.log('💬 Seeding Wishlists, Follows & Discussions...');
  // Rina wishlist event 1
  await prisma.wishlist.create({
    data: {
      customer_id: custRina.id,
      event_id: event1.id,
    },
  });

  // Rina follow Aozora Collective
  await prisma.follow.create({
    data: {
      follower_id: custRina.id,
      organizer_id: orgUser1.id,
    },
  });

  // Q&A Wall Discussion
  const question1 = await prisma.eventDiscussion.create({
    data: {
      event_id: event1.id,
      user_id: custRina.id,
      content: 'Apakah lansia dengan riwayat penyakit jantung aman mengikuti tayangan 4D ini?',
    },
  });

  // Organizer Reply & Pin
  await prisma.eventDiscussion.create({
    data: {
      event_id: event1.id,
      user_id: orgUser1.id,
      parent_id: question1.id,
      content: 'Disarankan untuk berkonsultasi terlebih dahulu karena terdapat efek getaran dan gerakan kursi yang cukup intens.',
      is_pinned: true,
    },
  });

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });