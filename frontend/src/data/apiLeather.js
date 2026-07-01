import { fetchJson } from '../utils/api.js'

export async function fetchMaterials() {
  return fetchJson('/materials/')
}
export async function fetchMaterialsFiltered({ q, type } = {}) {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (type) params.set('type', type)
  const url = `/materials/${params.toString() ? `?${params.toString()}` : ''}`
  return fetchJson(url)
}

export async function fetchMaterialById(materialId) {
  return fetchJson(`/materials/${materialId}/`)
}

export async function fetchOrders() {
  return fetchJson('/orders/')
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

export async function updateBatch(batchCode, batchPayload) {
  return fetchJson(`/batches/${batchCode}/`, {
    method: 'PATCH',
    body: JSON.stringify(batchPayload),
  })
}

export async function deleteBatch(batchCode) {
  return fetchJson(`/batches/${batchCode}/`, {
    method: 'DELETE',
  })
}

export async function fetchBatches({ limit } = {}) {
  const params = new URLSearchParams()
  if (limit) params.set('limit', String(limit))
  const url = `/batches/${params.toString() ? `?${params.toString()}` : ''}`
  return fetchJson(url)
}

export async function createOrder(orderPayload) {
  return fetchJson('/orders/', {
    method: 'POST',
    body: JSON.stringify(orderPayload),
  })
}

export async function deleteOrder(orderId) {
  return fetchJson(`/orders/${orderId}/`, {
    method: 'DELETE',
  })
}
