// Mock data layer for the Cutwise IMS Sales Module.
// No backend yet — everything here is local, in-memory sample data that
// mirrors the shape the Django API will eventually return.

export const LEATHER_TYPES = ['Cowhide', 'Goat Skin', 'Scrap Leather']
export const SCRAP_UNIT = 'kg'

export const unitForType = (leatherType) =>
  leatherType === 'Scrap Leather' ? SCRAP_UNIT : 'sqft'

export const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

// Each row represents one physical hide / batch sitting in the warehouse.
// Schema: { batch_code, material_name, leather_type, size_sqft, quantity,
//           sale_price, unit_price, company, status }
// (sku, dimensions, quality_grade, tint and tag are extra fields used to
// drive the UI — they extend the schema rather than replace it.)
export const hideBatches = [
  // Full Grain Cow Nappa — best seller
  { batch_code: 'CH-2024-BR-A', material_name: 'Full Grain Cow Nappa', leather_type: 'Cowhide', sku: 'CH-2024-BR', size_sqft: 142.0, quantity: 1, sale_price: 285, unit_price: 178, company: 'Tannería del Sol', status: 'Available', quality_grade: 'Grade A', added: '3d ago' },
  { batch_code: 'CH-2024-BR-B', material_name: 'Full Grain Cow Nappa', leather_type: 'Cowhide', sku: 'CH-2024-BR', size_sqft: 168.5, quantity: 1, sale_price: 285, unit_price: 178, company: 'Tannería del Sol', status: 'Available', quality_grade: 'Grade A', added: '3d ago' },
  { batch_code: 'CH-2024-BR-C', material_name: 'Full Grain Cow Nappa', leather_type: 'Cowhide', sku: 'CH-2024-BR', size_sqft: 110.2, quantity: 1, sale_price: 285, unit_price: 178, company: 'Tannería del Sol', status: 'Reserved', quality_grade: 'Grade B', added: '1w ago' },

  // Tan Pebble Grain — on sale
  { batch_code: 'PB-882-TAN-A', material_name: 'Tan Pebble Grain', leather_type: 'Cowhide', sku: 'PB-882-TAN', size_sqft: 96.4, quantity: 1, sale_price: 315, unit_price: 205, company: 'Cebu Hide Co.', status: 'Available', quality_grade: 'Grade A', added: '5d ago' },
  { batch_code: 'PB-882-TAN-B', material_name: 'Tan Pebble Grain', leather_type: 'Cowhide', sku: 'PB-882-TAN', size_sqft: 88.0, quantity: 1, sale_price: 315, unit_price: 205, company: 'Cebu Hide Co.', status: 'Available', quality_grade: 'Grade B', added: '5d ago' },

  // Black Goat Suede — low stock
  { batch_code: 'GS-90-SUE-A', material_name: 'Black Goat Suede', leather_type: 'Goat Skin', sku: 'GS-90-SUE', size_sqft: 18.6, quantity: 1, sale_price: 225, unit_price: 140, company: 'Bicol Goat Traders', status: 'Available', quality_grade: 'Grade B', added: '2w ago' },

  // Cognac Veg-Tan — best seller
  { batch_code: 'VT-1090-D04-A', material_name: 'Cognac Veg-Tan', leather_type: 'Cowhide', sku: 'VT-1090-D04', size_sqft: 74.0, quantity: 1, sale_price: 360, unit_price: 230, company: 'Manila Veg-Tan Works', status: 'Available', quality_grade: 'Grade A', added: '6d ago' },
  { batch_code: 'VT-1090-D04-B', material_name: 'Cognac Veg-Tan', leather_type: 'Cowhide', sku: 'VT-1090-D04', size_sqft: 80.5, quantity: 1, sale_price: 360, unit_price: 230, company: 'Manila Veg-Tan Works', status: 'Depleted', quality_grade: 'Grade A', added: '3w ago' },

  // Mixed Scrap Leather — sold by kg
  { batch_code: 'SC-90-MIS-A', material_name: 'Mixed Scrap Leather', leather_type: 'Scrap Leather', sku: 'SC-90-MIS', size_sqft: 45.0, quantity: 1, sale_price: 85, unit_price: 40, company: 'EcoScrap Recyclers', status: 'Available', quality_grade: 'Mixed', added: '1d ago' },
  { batch_code: 'SC-90-MIS-B', material_name: 'Mixed Scrap Leather', leather_type: 'Scrap Leather', sku: 'SC-90-MIS', size_sqft: 38.0, quantity: 1, sale_price: 85, unit_price: 40, company: 'EcoScrap Recyclers', status: 'Available', quality_grade: 'Mixed', added: '1d ago' },

  // Deep Navy Pull-up
  { batch_code: 'PU-99-90-A', material_name: 'Deep Navy Pull-up', leather_type: 'Goat Skin', sku: 'PU-99-90', size_sqft: 52.5, quantity: 1, sale_price: 330, unit_price: 210, company: 'Davao Goat Hides', status: 'Available', quality_grade: 'Grade A', added: '4d ago' },
  { batch_code: 'PU-99-90-B', material_name: 'Deep Navy Pull-up', leather_type: 'Goat Skin', sku: 'PU-99-90', size_sqft: 47.0, quantity: 1, sale_price: 330, unit_price: 210, company: 'Davao Goat Hides', status: 'Reserved', quality_grade: 'Grade B', added: '4d ago' },

  // Pebble Grain Nappa — featured detail-page example
  { batch_code: 'CH001-A', material_name: 'Pebble Grain Nappa', leather_type: 'Cowhide', sku: 'PGN-0089-021', size_sqft: 24.1, quantity: 1, sale_price: 695, unit_price: 430, company: 'Toscana Conceria', status: 'Available', quality_grade: 'Grade A', added: '2d ago' },
  { batch_code: 'CH001-B', material_name: 'Pebble Grain Nappa', leather_type: 'Cowhide', sku: 'PGN-0089-021', size_sqft: 22.45, quantity: 1, sale_price: 695, unit_price: 430, company: 'Toscana Conceria', status: 'Available', quality_grade: 'Grade A', added: '2d ago' },
  { batch_code: 'CH001-C', material_name: 'Pebble Grain Nappa', leather_type: 'Cowhide', sku: 'PGN-0089-021', size_sqft: 19.8, quantity: 1, sale_price: 695, unit_price: 430, company: 'Toscana Conceria', status: 'Reserved', quality_grade: 'Grade B', added: '2w ago' },
  { batch_code: 'CH001-D', material_name: 'Pebble Grain Nappa', leather_type: 'Cowhide', sku: 'PGN-0089-021', size_sqft: 26.3, quantity: 1, sale_price: 695, unit_price: 430, company: 'Toscana Conceria', status: 'Depleted', quality_grade: 'Grade A', added: '1mo ago' },

  // Italian Nappa — premium import, best seller
  { batch_code: 'MT-2024-NP-01', material_name: 'Italian Nappa', leather_type: 'Cowhide', sku: 'MT-2024-NP-01', size_sqft: 22.4, quantity: 1, sale_price: 1980, unit_price: 1320, company: 'Milano Pelletteria', status: 'Available', quality_grade: 'Grade A', added: '12h ago' },
  { batch_code: 'MT-2024-NP-02', material_name: 'Italian Nappa', leather_type: 'Cowhide', sku: 'MT-2024-NP-01', size_sqft: 20.9, quantity: 1, sale_price: 1980, unit_price: 1320, company: 'Milano Pelletteria', status: 'Available', quality_grade: 'Grade A', added: '12h ago' },

  // Pebbled Calfskin — premium
  { batch_code: 'RG-2023-PC-12', material_name: 'Pebbled Calfskin', leather_type: 'Cowhide', sku: 'RG-2023-PC-12', size_sqft: 18.0, quantity: 1, sale_price: 1250, unit_price: 860, company: 'Heritage Calf Works', status: 'Available', quality_grade: 'Grade A', added: '4d ago' },

  // Charcoal Suede
  { batch_code: 'MS-2023-SU-09', material_name: 'Charcoal Suede', leather_type: 'Goat Skin', sku: 'MS-2023-SU-09', size_sqft: 14.5, quantity: 1, sale_price: 545, unit_price: 360, company: 'Northern Suede Mills', status: 'Available', quality_grade: 'Grade B', added: '1w ago' },
]

// Visual identity per material — a tint colour multiplied over the shared
// leather texture placeholder, plus a short run of finish/colour swatches.
const materialStyles = {
  'Full Grain Cow Nappa': { tint: '#8B4A2E', tag: 'Best Seller', swatches: ['#8B4A2E', '#5B3220', '#C98A4B', '#2B1B14'], description: 'Premium full-grain cow nappa with a smooth finish suitable for footwear and accessories.' },
  'Tan Pebble Grain': { tint: '#B9853F', tag: 'Sale', swatches: ['#B9853F', '#8B5A2B', '#D9B077', '#6B4423'], description: 'Durable pebble-grain tan leather ideal for bags and belts.' },
  'Black Goat Suede': { tint: '#262223', tag: 'Low Stock', swatches: ['#262223', '#4A4142', '#1C0606'], description: 'Soft black goat suede for premium linings and delicate footwear components.' },
  'Cognac Veg-Tan': { tint: '#A6531E', tag: 'Best Seller', swatches: ['#A6531E', '#7A3B14', '#D98F4E'], description: 'Veg-tanned cognac leather with classic pull-up effect.' },
  'Mixed Scrap Leather': { tint: '#6B5A52', tag: null, swatches: ['#6B5A52', '#8B4A2E', '#262223', '#B9853F'], description: 'Assorted offcuts and scraps sold by weight.' },
  'Deep Navy Pull-up': { tint: '#2C3A52', tag: null, swatches: ['#2C3A52', '#1C2538', '#46587A'], description: 'Durable pull-up finish with navy hue.' },
  'Pebble Grain Nappa': { tint: '#7A3B23', tag: null, swatches: ['#7A3B23', '#5B3220', '#C98A4B', '#A6A6A6'], description: 'Pebble grain nappa perfect for structured goods.' },
  'Italian Nappa': { tint: '#7C5A3A', tag: 'Best Seller', swatches: ['#7C5A3A', '#3F2A1B', '#C9A06B'], description: 'Imported Italian nappa with fine grain and high durability.' },
  'Pebbled Calfskin': { tint: '#4A3528', tag: 'Best Seller', swatches: ['#4A3528', '#7A5A3E', '#2B1B14'], description: 'Smooth calfskin with light pebbling for refined goods.' },
  'Charcoal Suede': { tint: '#3A3536', tag: null, swatches: ['#3A3536', '#5C5456', '#1E1B1A'], description: 'Charcoal suede for sophisticated linings and trims.' },
}

const LOW_STOCK_SQFT = 30
const LOW_STOCK_WEIGHT = 30

function buildMaterials() {
  const byName = new Map()
  for (const batch of hideBatches) {
    if (!byName.has(batch.material_name)) byName.set(batch.material_name, [])
    byName.get(batch.material_name).push(batch)
  }

  return Array.from(byName.entries()).map(([material_name, batches]) => {
    const leather_type = batches[0].leather_type
    const unit = unitForType(leather_type)
    const sku = batches[0].sku
    const sale_price = batches[0].sale_price
    const unit_price = batches[0].unit_price
    const totalStock = batches.reduce(
      (sum, b) => (b.status === 'Depleted' ? sum : sum + b.size_sqft),
      0,
    )
    const style = materialStyles[material_name] || { tint: '#7A3B23', tag: null, swatches: ['#7A3B23'] }
    const threshold = unit === SCRAP_UNIT ? LOW_STOCK_WEIGHT : LOW_STOCK_SQFT
    const isLowStock = totalStock < threshold

    return {
      material_id: slugify(material_name),
      material_name,
      leather_type,
      sku,
      sale_price,
      unit_price,
      unit,
      totalStock,
      batchCount: batches.filter((b) => b.status !== 'Depleted').length,
      tag: isLowStock ? 'Low Stock' : style.tag,
      tint: style.tint,
      swatches: style.swatches,
      description: style.description || '',
    }
  })
}

export const materials = buildMaterials()

export function getMaterialById(materialId) {
  return materials.find((m) => m.material_id === materialId)
}

export function getBatchesForMaterial(materialId) {
  return hideBatches.filter((b) => slugify(b.material_name) === materialId)
}

// ---- Dashboard mock data -------------------------------------------------

export const recentSales = [
  {
    order_id: 'CW-7704-A',
    customer: 'Marikina Footworks',
    material: 'Full Grain Cow Nappa',
    qty: '38.0 sqft',
    total: 10830,
    createdAt: 'Jun 16, 2026 09:12 AM',
    date: 'Jun 16, 2026',
    status: 'Completed',
    fulfillment: 'Delivery',
    scheduledDate: 'Jun 20, 2026',
    scheduledTime: '10:30',
    address: 'Warehouse 5, Pasig City',
    description: 'Standard release full-grain cow nappa.',
    paymentMethod: 'Bank Transfer',
  },
  {
    order_id: 'CW-7703-B',
    customer: 'Liceo Shoe Supply',
    material: 'Italian Nappa',
    qty: '22.4 sqft',
    total: 44352,
    createdAt: 'Jun 16, 2026 10:45 AM',
    date: 'Jun 16, 2026',
    status: 'Completed',
    fulfillment: 'Pickup',
    scheduledDate: 'Jun 18, 2026',
    scheduledTime: '02:00',
    address: 'Marikina Store Pickup Area',
    description: 'Premium Italian Nappa for custom shoe order.',
    paymentMethod: 'Cash',
  },
  {
    order_id: 'CW-7702-A',
    customer: 'Rubberworld Trading',
    material: 'Mixed Scrap Leather',
    qty: `60.0 ${unitForType('Scrap Leather')}` ,
    total: 5100,
    createdAt: 'Jun 15, 2026 01:20 PM',
    date: 'Jun 15, 2026',
    status: 'Pending',
    fulfillment: 'Delivery',
    scheduledDate: 'Jun 22, 2026',
    scheduledTime: '11:00',
    address: 'Cebu Distribution Hub',
    description: 'Mixed scrap leather bundle for rubber tooling.',
    paymentMethod: 'Gcash',
  },
  {
    order_id: 'CW-7701-C',
    customer: 'Sta. Lucia Cobblers',
    material: 'Tan Pebble Grain',
    qty: '44.0 sqft',
    total: 13860,
    createdAt: 'Jun 15, 2026 03:05 PM',
    date: 'Jun 15, 2026',
    status: 'Completed',
    fulfillment: 'Pickup',
    scheduledDate: 'Jun 19, 2026',
    scheduledTime: '12:30',
    address: 'Sta. Lucia Mall Pickup Desk',
    description: 'Tan pebble grain for modular bag production.',
    paymentMethod: 'Credit Card',
  },
  {
    order_id: 'CW-7700-A',
    customer: 'Marikina Footworks',
    material: 'Cognac Veg-Tan',
    qty: '29.5 sqft',
    total: 10620,
    createdAt: 'Jun 14, 2026 08:55 AM',
    date: 'Jun 14, 2026',
    status: 'Pending',
    fulfillment: 'Delivery',
    scheduledDate: 'Jun 21, 2026',
    scheduledTime: '09:45',
    address: 'Manila Delivery Terminal',
    description: 'Cognac veg-tan for premium wallet batch.',
    paymentMethod: 'Cash',
  },
  {
    order_id: 'CW-7699-B',
    customer: 'Davao Boot Co.',
    material: 'Black Goat Suede',
    qty: '12.0 sqft',
    total: 2700,
    createdAt: 'Jun 13, 2026 11:15 AM',
    date: 'Jun 13, 2026',
    status: 'Completed',
    fulfillment: 'Pickup',
    scheduledDate: 'Jun 17, 2026',
    scheduledTime: '03:30',
    address: 'Davao Pickup Counter',
    description: 'Black goat suede for boot upper panels.',
    paymentMethod: 'Bank Transfer',
  },
]

export const salesByTypeData = [
  { type: 'Cowhide', qty: 1240, unit: 'sqft' },
  { type: 'Goat Skin', qty: 480, unit: 'sqft' },
  { type: 'Scrap Leather', qty: 312, unit: unitForType('Scrap Leather') },
]

export const revenueShareData = [
  { type: 'Cowhide', value: 64, color: '#8B2525' },
  { type: 'Goat Skin', value: 24, color: '#C76B6B' },
  { type: 'Scrap Leather', value: 12, color: '#E8B4B4' },
]

export const dashboardKpis = {
  totalRevenue: recentSales.reduce((sum, s) => sum + s.total, 0),
  leatherSoldSqft: 1772,
  leatherSoldWeight: 312,
  leatherSoldKg: 312,
  totalOrders: recentSales.filter((s) => s.status === 'Completed').length,
  lowStockItems: materials.filter((m) => m.tag === 'Low Stock').length,
}
