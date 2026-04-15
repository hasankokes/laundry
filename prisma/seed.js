// Seed script for Çamaşırhane Yönetim Sistemi
// Run with: node prisma/seed.js

const BASE_URL = 'http://localhost:3000/api'

async function api(path, method = 'GET', body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(`${BASE_URL}${path}`, opts)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API error ${res.status}: ${text}`)
  }
  return res.json()
}

async function seed() {
  console.log('🌱 Seeding database...')

  // Create Services
  console.log('Creating services...')
  const services = await Promise.all([
    api('/services', 'POST', { name: 'Yıkama', unit: 'kg', defaultPrice: 15 }),
    api('/services', 'POST', { name: 'Ütüleme', unit: 'adet', defaultPrice: 10 }),
    api('/services', 'POST', { name: 'Kuru Temizleme', unit: 'takım', defaultPrice: 120 }),
    api('/services', 'POST', { name: 'Perde Yıkama', unit: 'takım', defaultPrice: 80 }),
    api('/services', 'POST', { name: 'Halı Yıkama', unit: 'metre', defaultPrice: 25 }),
    api('/services', 'POST', { name: 'Çarşaf Yıkama', unit: 'paket', defaultPrice: 35 }),
    api('/services', 'POST', { name: 'Battaniye Yıkama', unit: 'adet', defaultPrice: 45 }),
  ])
  console.log(`  Created ${services.length} services`)

  // Create Customers
  console.log('Creating customers...')
  const [otel, restoran, klinik, cafe] = await Promise.all([
    api('/customers', 'POST', {
      name: 'Otel Grand Plaza',
      phone: '+90 212 555 0101',
      address: 'Taksim Meydanı No: 1, Beyoğlu, İstanbul',
      tag: 'Otel',
    }),
    api('/customers', 'POST', {
      name: 'Restoran Deniz',
      phone: '+90 216 555 0202',
      address: 'Bağdat Cad. No: 45, Kadıköy, İstanbul',
      tag: 'Restoran',
    }),
    api('/customers', 'POST', {
      name: 'Klinik Sağlık Merkezi',
      phone: '+90 212 555 0303',
      address: 'Cumhuriyet Cad. No: 78, Şişli, İstanbul',
      tag: 'Hastane',
    }),
    api('/customers', 'POST', {
      name: 'Cafe Mavi',
      phone: '+90 216 555 0404',
      address: 'Moda Cad. No: 12, Kadıköy, İstanbul',
      tag: 'Restoran',
    }),
  ])
  console.log(`  Created 4 customers`)

  // Get service IDs by name
  const svcMap = {}
  for (const s of services) {
    svcMap[s.name] = s.id
  }

  // Create Daily Records
  console.log('Creating daily records...')
  const records = [
    // April 1
    { customerId: klinik.id, serviceId: svcMap['Battaniye Yıkama'], date: '2026-04-01', quantity: 16, unitPrice: 10 },
    // April 2
    { customerId: otel.id, serviceId: svcMap['Perde Yıkama'], date: '2026-04-02', quantity: 13, unitPrice: 20 },
    // April 3
    { customerId: restoran.id, serviceId: svcMap['Kuru Temizleme'], date: '2026-04-03', quantity: 15, unitPrice: 20 },
    { customerId: klinik.id, serviceId: svcMap['Perde Yıkama'], date: '2026-04-03', quantity: 5, unitPrice: 23 },
    // April 4
    { customerId: klinik.id, serviceId: svcMap['Kuru Temizleme'], date: '2026-04-04', quantity: 12, unitPrice: 20 },
    { customerId: cafe.id, serviceId: svcMap['Halı Yıkama'], date: '2026-04-04', quantity: 13, unitPrice: 15 },
    // April 5
    { customerId: otel.id, serviceId: svcMap['Kuru Temizleme'], date: '2026-04-05', quantity: 15, unitPrice: 25 },
    { customerId: klinik.id, serviceId: svcMap['Halı Yıkama'], date: '2026-04-05', quantity: 18, unitPrice: 35 },
    // April 6
    { customerId: cafe.id, serviceId: svcMap['Halı Yıkama'], date: '2026-04-06', quantity: 13, unitPrice: 15 },
    // April 7
    { customerId: klinik.id, serviceId: svcMap['Perde Yıkama'], date: '2026-04-07', quantity: 60, unitPrice: 23 },
    { customerId: otel.id, serviceId: svcMap['Halı Yıkama'], date: '2026-04-07', quantity: 45, unitPrice: 25 },
    // April 8
    { customerId: klinik.id, serviceId: svcMap['Battaniye Yıkama'], date: '2026-04-08', quantity: 16, unitPrice: 10 },
    // April 9
    { customerId: klinik.id, serviceId: svcMap['Kuru Temizleme'], date: '2026-04-09', quantity: 12, unitPrice: 20 },
    // April 10
    { customerId: klinik.id, serviceId: svcMap['Perde Yıkama'], date: '2026-04-10', quantity: 15, unitPrice: 23 },
    { customerId: otel.id, serviceId: svcMap['Kuru Temizleme'], date: '2026-04-10', quantity: 23, unitPrice: 25 },
    // April 11
    { customerId: otel.id, serviceId: svcMap['Kuru Temizleme'], date: '2026-04-11', quantity: 5, unitPrice: 25 },
    // April 12
    { customerId: restoran.id, serviceId: svcMap['Kuru Temizleme'], date: '2026-04-12', quantity: 15, unitPrice: 20 },
    // April 13
    { customerId: klinik.id, serviceId: svcMap['Kuru Temizleme'], date: '2026-04-13', quantity: 12, unitPrice: 20 },
    // April 14
    { customerId: otel.id, serviceId: svcMap['Perde Yıkama'], date: '2026-04-14', quantity: 13, unitPrice: 20 },
    { customerId: restoran.id, serviceId: svcMap['Kuru Temizleme'], date: '2026-04-14', quantity: 15, unitPrice: 20 },
  ]

  for (const record of records) {
    await api('/records', 'POST', record)
  }
  console.log(`  Created ${records.length} daily records`)

  // Create Payments
  console.log('Creating payments...')
  const payments = [
    { customerId: otel.id, amount: 500, date: '2026-04-10', method: 'havale', description: 'Nisan ödeme' },
    { customerId: klinik.id, amount: 1500, date: '2026-04-08', method: 'nakit', description: 'Nisan ilk ödeme' },
    { customerId: klinik.id, amount: 1000, date: '2026-04-14', method: 'havale', description: 'Nisan ikinci ödeme' },
    { customerId: restoran.id, amount: 200, date: '2026-04-12', method: 'kredi_karti', description: null },
  ]
  for (const payment of payments) {
    await api('/payments', 'POST', payment)
  }
  console.log(`  Created ${payments.length} payments`)

  // Set customer-specific prices
  console.log('Setting customer prices...')
  await api('/prices', 'POST', { customerId: klinik.id, serviceId: svcMap['Halı Yıkama'], price: 35 })
  await api('/prices', 'POST', { customerId: otel.id, serviceId: svcMap['Kuru Temizleme'], price: 25 })
  console.log('  Set 2 custom prices')

  console.log('✅ Seeding complete!')
}

seed().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
