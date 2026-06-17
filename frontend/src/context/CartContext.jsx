import { createContext, useContext, useMemo, useState, useCallback } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [fulfillment, setFulfillment] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [orderDescription, setOrderDescription] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [isSummaryOpen, setIsSummaryOpen] = useState(false)
  const [lastConfirmation, setLastConfirmation] = useState(null)

  // Add a line item. If the same material + batch is already in the cart,
  // bump its quantity instead of creating a duplicate row.
  const addToCart = useCallback((line) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (it) => it.materialId === line.materialId && it.batchCode === line.batchCode,
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
  const shipping = 0
  const total = itemsSubtotal
  const itemCount = useMemo(() => items.reduce((sum, it) => sum + it.qty, 0), [items])

  const confirmSale = useCallback(() => {
    setLastConfirmation({
      transactionId: `CW-${Math.floor(7000 + Math.random() * 999)}-${String.fromCharCode(
        65 + Math.floor(Math.random() * 26),
      )}`,
      total,
      itemCount,
    })
    clearCart()
    clearOrderDetails()
    setIsSummaryOpen(false)
  }, [total, itemCount, clearCart, clearOrderDetails])

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
    itemsSubtotal,
    shipping,
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
