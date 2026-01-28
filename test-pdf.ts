
// We need to import the function but since it's a relative import of a TS file,
// we'll rely on tsx handling it if we point correctly.
// However, since pdf-utils.ts is in ./lib, we can import it.

import { generateBillPDF } from './lib/pdf-utils'

try {
    // Mock settings
    const settings = {
        name: 'Test Hotel',
        address: '123 Main St',
        phone: '1234567890',
        email: 'test@hotel.com',
        gstin: 'GSTIN123'
    }

    // Mock bill data
    const billData = {
        invoiceNumber: 'INV-001',
        billDate: new Date(),
        guestName: 'John Doe',
        billNumber: 'BILL-001',
        visitorRegistrationNumber: 'REG-001',
        roomNumber: '101',
        roomType: 'Deluxe',
        roomCharges: 1000,
        tariff: 0,
        foodCharges: 200,
        foodItems: [],
        days: 1,
        checkInDate: new Date(),
        checkoutDate: new Date(),
        gstEnabled: false,
        gstAmount: 0,
        advanceAmount: 0,
        roundOff: 0,
        totalAmount: 1200,
        paymentMode: 'CASH',
        guestAddress: null,
        guestMobile: null,
        guestNationality: null
    }

    console.log('Generating PDF...')
    const doc = generateBillPDF(settings, billData)

    // Try to output
    const buffer = doc.output('arraybuffer')
    console.log('PDF generated successfully, size:', buffer.byteLength)

} catch (error) {
    console.error('Error generating PDF:', error)
}
