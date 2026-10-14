import { v2 as cloudinary } from 'cloudinary';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const prisma = new PrismaClient();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function migrate() {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    console.log('Uploads directory not found.');
    return;
  }

  const files = fs.readdirSync(uploadsDir).filter(f => f !== '.gitkeep' && !fs.statSync(path.join(uploadsDir, f)).isDirectory());
  console.log(`Found ${files.length} files in uploads directory.`);

  const urlMap = new Map<string, string>();

  // 1. Upload each file to Cloudinary
  for (const filename of files) {
    const filePath = path.join(uploadsDir, filename);
    console.log(`Uploading ${filename} to Cloudinary...`);
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'kagemaya/migrated',
        resource_type: 'image',
      });
      console.log(`Uploaded ${filename} -> ${result.secure_url}`);
      urlMap.set(filename, result.secure_url);
      urlMap.set(`/uploads/${filename}`, result.secure_url);
      urlMap.set(`uploads/${filename}`, result.secure_url);
    } catch (err: any) {
      console.error(`Failed to upload ${filename}:`, err.message);
    }
  }

  console.log('\n--- Updating Database Records ---');

  // 2. Update User profile_picture
  const users = await prisma.user.findMany({
    where: { profile_picture: { not: null } },
  });
  for (const user of users) {
    if (!user.profile_picture) continue;
    for (const [key, secureUrl] of urlMap.entries()) {
      if (user.profile_picture.includes(key)) {
        await prisma.user.update({
          where: { id: user.id },
          data: { profile_picture: secureUrl },
        });
        console.log(`Updated User (${user.name}) profile_picture -> ${secureUrl}`);
        break;
      }
    }
  }

  // 3. Update Event banner_url
  const events = await prisma.event.findMany({
    where: { banner_url: { not: null } },
  });
  for (const ev of events) {
    if (!ev.banner_url) continue;
    for (const [key, secureUrl] of urlMap.entries()) {
      if (ev.banner_url.includes(key)) {
        await prisma.event.update({
          where: { id: ev.id },
          data: { banner_url: secureUrl },
        });
        console.log(`Updated Event (${ev.title}) banner_url -> ${secureUrl}`);
        break;
      }
    }
  }

  // 4. Update Transaction payment_proof_url
  const transactions = await prisma.transaction.findMany({
    where: { payment_proof_url: { not: null } },
  });
  for (const tr of transactions) {
    if (!tr.payment_proof_url) continue;
    for (const [key, secureUrl] of urlMap.entries()) {
      if (tr.payment_proof_url.includes(key)) {
        await prisma.transaction.update({
          where: { id: tr.id },
          data: { payment_proof_url: secureUrl },
        });
        console.log(`Updated Transaction (${tr.id}) payment_proof_url -> ${secureUrl}`);
        break;
      }
    }
  }

  console.log('\nMigration to Cloudinary completed successfully!');
}

migrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
