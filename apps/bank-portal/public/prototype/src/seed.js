const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenantId = "tenant_kamolot_01";

  console.log('🌱 Seeding SMB Operations data...');

  // 1. Seed Products (matching smb-inventory.jsx)
  const p1 = await prisma.product.upsert({
    where: { sku: 'KS-0102' },
    update: {},
    create: {
      tenantId,
      sku: 'KS-0102',
      name: 'Cooking oil, sunflower 5L',
      category: 'Pantry',
      stock: 1240,
      minStock: 300,
      unitPrice: 48000.00,
      status: 'In stock',
    }
  });

  const p2 = await prisma.product.upsert({
    where: { sku: 'KS-0104' },
    update: {},
    create: {
      tenantId,
      sku: 'KS-0104',
      name: 'Sugar refined 50kg bag',
      category: 'Pantry',
      stock: 86,
      minStock: 120,
      unitPrice: 310000.00,
      status: 'Low',
    }
  });

  // 2. Seed BOMs (matching smb-rest.jsx)
  const bom1 = await prisma.bOM.upsert({
    where: { code: 'BOM-01' },
    update: {},
    create: {
      tenantId,
      code: 'BOM-01',
      recipeName: 'Sunflower oil 5L (repack)',
      outputRate: '120/day',
      unitCost: 42500.00,
      status: 'Active',
      components: {
        create: [
          { productId: p1.id, quantity: 1 }
        ]
      }
    }
  });

  // 3. Seed Work Orders (matching ServicesKanban)
  await prisma.workOrder.createMany({
    data: [
      { id: '1001', tenantId, customer: "Oriental Trade", task: "Delivery · Tashkent", assignee: "JA", status: "Requested" },
      { id: '1010', tenantId, customer: "Zamon Foods", task: "Cold chain delivery", assignee: "MK", status: "Approved" },
      { id: '1020', tenantId, customer: "Kamolot branch #2", task: "Internal transfer", assignee: "BY", status: "In progress" },
      { id: '1030', tenantId, customer: "Chorsu Market", task: "Delivery", assignee: "BY", status: "Completed" },
    ].map(wo => ({ ...wo, id: undefined })) // Let DB generate cuid but keep logic same
  });

  // 4. Seed a sample movement
  await prisma.stockMovement.create({
    data: {
      productId: p1.id,
      type: 'RECEIVED',
      quantity: 120,
      reference: 'WB-23887',
    }
  });

  console.log('✅ Seed complete. Database is ready for D2 testing.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });