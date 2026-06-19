import { createContext, useContext, useMemo, useState, useCallback } from 'react'
import { createOrder } from '../data/apiLeather.js'

const CartContext = createContext(null)
const SHIPPING_FEE = 250 // Shipping fee in pesos for delivery orders

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [fulfillment, setFulfillment] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [orderDescription, setOrderDescription] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Over the Counter')
  const [isSummaryOpen, setIsSummaryOpen] = useState(false)
  const [lastConfirmation, setLastConfirmation] = useState(null)

  // Add a line item. If the same material + batch is already in the cart,
  // bump its quantity instead of creating a duplicate row.
  const addToCart = useCallback((line) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (it) =>
          it.materialId === line.materialId &&
          it.batchCode === line.batchCode &&
          it.customSize === (line.customSize || ''),
      )
      if (existingIndex !== -1) {
        const next = [...prev]
        next[existingIndex] = {
          ...next[existingIndex],
          ...line,
          qty: line.qty,
        }
        return next
      }
      return [...prev, { ...line, id: `${line.materialId}-${line.batchCode}-${Date.now()}` }]
    })
  }, [])

  const removeFromCart = useCallback((id) => {
    setItems((prev) => prev.filter((it) => it.id !== id))
  }, [])

  const updateQty = useCallback((id, qty) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, qty: Math.max(1, qty) } : it)))
  }, [])

  const clearOrderDetails = useCallback(() => {
    setCustomerName('')
    setOrderDescription('')
    setDeliveryAddress('')
    setScheduledDate('')
    setScheduledTime('')
    setPaymentMethod('Over the Counter')
    setFulfillment('')
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
    clearOrderDetails()
  }, [clearOrderDetails])

  const itemsSubtotal = useMemo(
    () => items.reduce((sum, it) => sum + it.unitPrice * it.qty, 0),
    [items],
  )
  const cuttingFee = useMemo(
    () => items.reduce((sum, it) => sum + (it.customSize ? 50 : 0), 0),
    [items],
  )
  const vat = useMemo(() => Number((cuttingFee * 0.12).toFixed(2)), [cuttingFee])
  const shipping = useMemo(() => (fulfillment === 'Delivery' ? SHIPPING_FEE : 0), [fulfillment])
  const total = useMemo(() => itemsSubtotal + shipping + cuttingFee + vat, [itemsSubtotal, shipping, cuttingFee, vat])
  const itemCount = useMemo(() => items.reduce((sum, it) => sum + it.qty, 0), [items])

  const confirmSale = useCallback(async () => {
    const payload = {
      customer: customerName,
      fulfillment,
      delivery_address: deliveryAddress,
      order_description: orderDescription,
      scheduled_date: scheduledDate || null,
      scheduled_time: scheduledTime || null,
      payment_method: paymentMethod,
      items: items.map((item) => ({
        material_name: item.materialName,
        batch_code: item.batchCode,
        unit: item.unit,
        unit_price: item.unitPrice,
        qty: item.qty,
        size_sqft: item.sizeSqft,
        custom_size: item.customSize || '',
        color: item.color || '',
      })),
    }

    const orderResponse = await createOrder(payload)

    setLastConfirmation({
      transactionId: orderResponse.order_id,
      total: Number(orderResponse.total),
      itemCount: Number(orderResponse.item_count),
    })
    clearCart()
    clearOrderDetails()
    setIsSummaryOpen(false)
    return orderResponse
  }, [customerName, fulfillment, deliveryAddress, orderDescription, scheduledDate, scheduledTime, paymentMethod, items, clearCart, clearOrderDetails])

  const value = {
    items,
    addToCart,
    removeFromCart,
    updateQty,
    clearCart,
    fulfillment,
    setFulfillment,
    customerName,
    setCustomerName,
    orderDescription,
    setOrderDescription,
    deliveryAddress,
    setDeliveryAddress,
    scheduledDate,
    setScheduledDate,
    scheduledTime,
    setScheduledTime,
    paymentMethod,
    setPaymentMethod,
    itemsSubtotal,
    shipping,
    cuttingFee,
    vat,
    total,
    itemCount,
    isSummaryOpen,
    openSummary: () => setIsSummaryOpen(true),
    closeSummary: () => setIsSummaryOpen(false),
    confirmSale,
    lastConfirmation,
    clearConfirmation: () => setLastConfirmation(null),
    clearOrderDetails,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}
