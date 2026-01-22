import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * Data structure for bill generation
 */
export interface BillTemplateData {
  // Hotel Information
  hotelName: string
  hotelAddress: string
  hotelPhone: string
  hotelEmail: string
  hotelGstin: string

  // Bill Meta Information
  billNumber?: string | null
  invoiceNumber: string
  billDate: string

  // Room Details
  roomNumber?: string
  roomType?: string
  rentPerDay: string
  numberOfDays: string

  // Guest Details
  guestName: string
  guestAddress?: string
  guestState?: string
  guestNationality?: string
  guestGstNumber?: string
  guestMobile?: string

  // Check-in/Check-out Details
  checkInDateTime?: string
  checkOutDateTime?: string
  adults?: string
  children?: string
  totalGuests?: string

  // Company Details
  companyName?: string
  companyDepartment?: string
  companyDesignation?: string

  // Billing Items
  billingItems: Array<{
    date: string
    quantity: string
    product: string
    rate: string
    value: string
  }>

  // Charges Summary
  roomChargesBeforeTax: string
  gstOnRoomCharges: string
  foodCharges: string
  gstOnFoodCharges: string
  paymentMode: string
  totalBillAmount: string
  advanceAmount: string
  roundOff: string
  netPayableAmount: string
}

/**
 * Format currency with Rs. prefix
 */
export function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Format date and time for display
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Load HTML template
 */
export function loadBillTemplate(): string {
  try {
    const templatePath = join(process.cwd(), 'lib', 'bill-template.html')
    return readFileSync(templatePath, 'utf-8')
  } catch (error) {
    console.error('Error loading bill template:', error)
    throw new Error('Failed to load bill template')
  }
}

/**
 * Replace template placeholders with actual data
 */
export function renderBillTemplate(data: BillTemplateData): string {
  let html = loadBillTemplate()

  // Hotel Information
  html = html.replace(/{{HOTEL_NAME}}/g, data.hotelName || '')
  html = html.replace(/{{HOTEL_ADDRESS}}/g, data.hotelAddress || '')
  html = html.replace(/{{HOTEL_PHONE}}/g, data.hotelPhone || '')
  html = html.replace(/{{HOTEL_EMAIL}}/g, data.hotelEmail || '')
  html = html.replace(/{{HOTEL_GSTIN}}/g, data.hotelGstin || '')

  // Meta Information
  html = html.replace(/{{BILL_NUMBER}}/g, data.billNumber || '')
  html = html.replace(/{{INVOICE_NUMBER}}/g, data.invoiceNumber || '')
  html = html.replace(/{{BILL_DATE}}/g, data.billDate || '')

  // Room Details
  html = html.replace(/{{ROOM_NUMBER}}/g, data.roomNumber || '')
  html = html.replace(/{{ROOM_TYPE}}/g, data.roomType || '')
  html = html.replace(/{{RENT_PER_DAY}}/g, data.rentPerDay || '')
  html = html.replace(/{{NUMBER_OF_DAYS}}/g, data.numberOfDays || '')

  // Guest Details
  html = html.replace(/{{GUEST_NAME}}/g, data.guestName || '')
  html = html.replace(/{{GUEST_ADDRESS}}/g, data.guestAddress || '')
  html = html.replace(/{{GUEST_STATE}}/g, data.guestState || '')
  html = html.replace(/{{GUEST_NATIONALITY}}/g, data.guestNationality || '')
  html = html.replace(/{{GUEST_GST_NUMBER}}/g, data.guestGstNumber || '')
  html = html.replace(/{{GUEST_MOBILE}}/g, data.guestMobile || '')

  // Check-in/Check-out
  html = html.replace(/{{CHECK_IN_DATE_TIME}}/g, data.checkInDateTime || '')
  html = html.replace(/{{CHECK_OUT_DATE_TIME}}/g, data.checkOutDateTime || '')
  html = html.replace(/{{ADULTS}}/g, data.adults || '')
  html = html.replace(/{{CHILDREN}}/g, data.children || '')
  html = html.replace(/{{TOTAL_GUESTS}}/g, data.totalGuests || '')

  // Company Details
  html = html.replace(/{{COMPANY_NAME}}/g, data.companyName || '')
  html = html.replace(/{{COMPANY_DEPARTMENT}}/g, data.companyDepartment || '')
  html = html.replace(/{{COMPANY_DESIGNATION}}/g, data.companyDesignation || '')

  // Billing Items
  let billingItemsRows = ''
  if (data.billingItems && data.billingItems.length > 0) {
    billingItemsRows = data.billingItems
      .map(
        (item) => `
      <tr>
        <td>${item.date}</td>
        <td>${item.quantity}</td>
        <td>${item.product}</td>
        <td>${item.rate}</td>
        <td>${item.value}</td>
      </tr>
    `
      )
      .join('')
  } else {
    // Empty rows to keep table visible
    billingItemsRows = `
      <tr>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
    `
  }
  html = html.replace(/{{BILLING_ITEMS_ROWS}}/g, billingItemsRows)

  // Charges Summary
  html = html.replace(/{{ROOM_CHARGES_BEFORE_TAX}}/g, data.roomChargesBeforeTax || 'Rs. 0.00')
  html = html.replace(/{{GST_ON_ROOM_CHARGES}}/g, data.gstOnRoomCharges || 'Rs. 0.00')
  html = html.replace(/{{FOOD_CHARGES}}/g, data.foodCharges || 'Rs. 0.00')
  html = html.replace(/{{GST_ON_FOOD_CHARGES}}/g, data.gstOnFoodCharges || 'Rs. 0.00')
  html = html.replace(/{{PAYMENT_MODE}}/g, data.paymentMode || 'CASH')
  html = html.replace(/{{TOTAL_BILL_AMOUNT}}/g, data.totalBillAmount || 'Rs. 0.00')
  html = html.replace(/{{ADVANCE_AMOUNT}}/g, data.advanceAmount || 'Rs. 0.00')
  html = html.replace(/{{ROUND_OFF}}/g, data.roundOff || 'Rs. 0.00')
  html = html.replace(/{{NET_PAYABLE_AMOUNT}}/g, data.netPayableAmount || 'Rs. 0.00')

  return html
}

/**
 * Convert BillData to BillTemplateData
 */
export function convertToTemplateData(
  settings: {
    name: string
    address: string
    phone: string
    email?: string | null
    gstin?: string | null
  },
  billData: {
    invoiceNumber: string
    billNumber?: string | null
    billDate: Date | string
    guestName: string
    guestAddress?: string | null
    guestState?: string | null
    guestNationality?: string | null
    guestGstNumber?: string | null
    guestMobile?: string | null
    companyName?: string | null
    companyCode?: string | null
    roomNumber?: string
    roomType?: string
    checkInDate?: Date | string
    checkoutDate?: Date | string
    days?: number
    roomCharges: number
    tariff: number
    foodCharges: number
    additionalGuestCharges?: number
    additionalGuests?: number
    gstEnabled: boolean
    gstPercent?: number
    gstAmount: number
    advanceAmount: number
    roundOff: number
    totalAmount: number
    paymentMode: string
    showGst?: boolean
    foodItems?: Array<{
      name: string
      quantity: number
      price: number
      gstPercent?: number
      total?: number
    }>
  }
): BillTemplateData {
  const showGst = billData.showGst !== false

  // Calculate room charges before tax
  const roomChargesBeforeTax = billData.roomCharges
  const roomGstAmount = showGst && billData.gstEnabled ? (roomChargesBeforeTax * (billData.gstPercent || 5)) / 100 : 0

  // Calculate food charges and GST
  const foodChargesBeforeTax = billData.foodCharges
  const foodGstAmount = showGst && billData.gstEnabled ? (foodChargesBeforeTax * (billData.gstPercent || 5)) / 100 : 0

  // Calculate rent per day
  const rentPerDay = billData.days && billData.days > 0 ? billData.roomCharges / billData.days : billData.roomCharges

  // Prepare billing items from food items
  const billingItems: Array<{
    date: string
    quantity: string
    product: string
    rate: string
    value: string
  }> = []

  if (billData.foodItems && billData.foodItems.length > 0) {
    billData.foodItems.forEach((item) => {
      const itemTotal = item.total || item.price * item.quantity
      billingItems.push({
        date: formatDate(new Date()),
        quantity: item.quantity.toString(),
        product: item.name,
        rate: formatCurrency(item.price),
        value: formatCurrency(itemTotal),
      })
    })
  }

  // Calculate total guests
  const adults = (billData.additionalGuests || 0) + 1 // Main guest + additional
  const totalGuests = adults.toString()

  return {
    // Hotel Information
    hotelName: settings.name,
    hotelAddress: settings.address,
    hotelPhone: settings.phone,
    hotelEmail: settings.email || '',
    hotelGstin: showGst ? settings.gstin || '' : '',

    // Bill Meta Information
    billNumber: billData.billNumber || '',
    invoiceNumber: billData.invoiceNumber,
    billDate: formatDate(billData.billDate),

    // Room Details
    roomNumber: billData.roomNumber || '',
    roomType: billData.roomType || '',
    rentPerDay: formatCurrency(rentPerDay),
    numberOfDays: (billData.days || 0).toString(),

    // Guest Details
    guestName: billData.guestName,
    guestAddress: billData.guestAddress || '',
    guestState: billData.guestState || '',
    guestNationality: billData.guestNationality || '',
    guestGstNumber: showGst ? billData.guestGstNumber || '' : '',
    guestMobile: billData.guestMobile || '',

    // Check-in/Check-out Details
    checkInDateTime: billData.checkInDate ? formatDateTime(billData.checkInDate) : '',
    checkOutDateTime: billData.checkoutDate ? formatDateTime(billData.checkoutDate) : '',
    adults: adults.toString(),
    children: '0',
    totalGuests,

    // Company Details
    companyName: billData.companyName || '',
    companyDepartment: '',
    companyDesignation: '',

    // Billing Items
    billingItems,

    // Charges Summary
    roomChargesBeforeTax: formatCurrency(roomChargesBeforeTax),
    gstOnRoomCharges: showGst ? formatCurrency(roomGstAmount) : 'Rs. 0.00',
    foodCharges: formatCurrency(foodChargesBeforeTax),
    gstOnFoodCharges: showGst ? formatCurrency(foodGstAmount) : 'Rs. 0.00',
    paymentMode: billData.paymentMode,
    totalBillAmount: formatCurrency(billData.totalAmount),
    advanceAmount: billData.advanceAmount > 0 ? formatCurrency(billData.advanceAmount) : 'Rs. 0.00',
    roundOff: billData.roundOff !== 0 ? formatCurrency(Math.abs(billData.roundOff)) : 'Rs. 0.00',
    netPayableAmount: formatCurrency(billData.totalAmount),
  }
}
