import { fetchJson } from '../utils/api.js'

export async function fetchMaterials() {
  return fetchJson('/materials/')
}

export async function fetchMaterialById(materialId) {
  return fetchJson(`/materials/${materialId}/`)
}

export async function fetchBatchesForMaterial(materialId) {
  return fetchJson(`/materials/${materialId}/batches/`)
}

export async function createBatch(batchPayload) {
  return fetchJson('/batches/', {
    method: 'POST',
    body: JSON.stringify(batchPayload),
  })
}

export async function createOrder(orderPayload) {
  return fetchJson('/orders/', {
    method: 'POST',
    body: JSON.stringify(orderPayload),
  })
}
