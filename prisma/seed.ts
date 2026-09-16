import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data for Ozha Food...');

  // 1. Initial Products / Menus
  const products = [
    {
      name: 'Pentol Kriwil',
      price: 15000,
      description: 'Pentol sapi kriwil berurat kasar super gurih & pedas mantap.',
      imageUrl: '',
      isActive: true,
      category: 'Pentol',
    },
    {
      name: 'Siomay Ayam',
      price: 12000,
      description: 'Siomay isi adonan ayam premium padat disajikan hangat dengan bumbu kacang gurih.',
      imageUrl: '',
      isActive: true,
      category: 'Siomay',
    },
    {
      name: 'Siomay Kubis',
      price: 10000,
      description: 'Siomay balut kubis segar sehat isi adonan daging ayam premium lezat.',
      imageUrl: '',
      isActive: true,
      category: 'Siomay',
    },
    {
      name: 'Tahu Bakso',
      price: 12500,
      description: 'Tahu bakso kukus jumbo gurih padat dengan isian olahan daging melimpah.',
      imageUrl: '',
      isActive: true,
      category: 'Bakso',
    },
  ];

  for (const prod of products) {
    const existing = await prisma.product.findFirst({ where: { name: prod.name } });
    if (!existing) {
      await prisma.product.create({ data: prod });
      console.log(`+ Product created: ${prod.name}`);
    }
  }

  // 2. Divisions
  const divisions = [
    'Direksi',
    'HRD & Finance',
    'Sales & Marketing',
    'IT Support & Developer',
    'Gudang & Logistik',
    'Produksi & Kitchen',
  ];

  for (const name of divisions) {
    await prisma.division.upsert({
      where: { name },
      update: {},
      create: { name, isActive: true },
    });
    console.log(`+ Division: ${name}`);
  }

  // 3. Locations
  const locations = ['Voza', 'Cabang A', 'Cabang B'];

  for (const name of locations) {
    await prisma.location.upsert({
      where: { name },
      update: {},
      create: { name, isActive: true },
    });
    console.log(`+ Location: ${name}`);
  }

  console.log('Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
