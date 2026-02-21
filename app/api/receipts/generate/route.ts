import { NextRequest, NextResponse } from 'next/server'
import { createReceipt, type Receipt, type ReceiptType } from '@/lib/firebase/database'
import { generateReceiptHTML, type ReceiptData } from '@/lib/templates/receipt-email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      orderId,
      sourceType,
      sourceId,
      receiptType,
      customerName,
      customerPhone,
      customerEmail,
      productName,
      brand,
      category,
      serialNumber,
      agreedPrice,
      showroomName,
      staffName,
      qcDecision,
      qcNotes,
    } = body

    if (!orderId || !sourceType || !receiptType || !customerName || !productName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const prefix = (receiptType as ReceiptType) === 'provisional' ? 'PROV' : 'FINAL'
    const receiptNumber = `${prefix}-${orderId}`
    const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

    const receiptData: Omit<Receipt, 'id' | 'createdAt'> = {
      orderId,
      sourceType,
      sourceId: sourceId || orderId,
      receiptType,
      receiptNumber,
      customerName,
      customerPhone: customerPhone || '',
      customerEmail: customerEmail || '',
      productName,
      brand: brand || '',
      category: category || '',
      serialNumber: serialNumber || '',
      agreedPrice: Number(agreedPrice) || 0,
      showroomName,
      staffName: staffName || '',
      qcDecision,
      qcNotes,
      date,
      sentToCustomer: false,
      sentToAdmin: false,
    }

    const receiptId = await createReceipt(receiptData)

    const emailData: ReceiptData = {
      receiptNumber,
      receiptType,
      date,
      sourceType,
      showroomName,
      customerName,
      customerPhone: customerPhone || '',
      customerEmail: customerEmail || '',
      productName,
      brand: brand || '',
      category: category || '',
      serialNumber: serialNumber || '',
      agreedPrice: Number(agreedPrice) || 0,
      staffName: staffName || '',
      qcDecision,
      qcNotes,
    }

    const html = generateReceiptHTML(emailData)

    // Send notifications in background (non-blocking)
    sendNotifications(emailData, html).catch(err => console.error('Notification error:', err))

    return NextResponse.json({ receiptId, receiptNumber, html })
  } catch (error: any) {
    console.error('Error generating receipt:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

async function sendNotifications(data: ReceiptData, html: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'

  // Email to customer
  if (data.customerEmail) {
    try {
      await fetch(`${baseUrl}/api/email/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: data.customerEmail,
          subject: data.receiptType === 'provisional'
            ? `Provisional Receipt - ${data.receiptNumber}`
            : `Final Bill - ${data.receiptNumber}`,
          html,
        }),
      })
    } catch (err) {
      console.error('Email notification failed:', err)
    }
  }

  // Telegram to admin
  try {
    const message = data.receiptType === 'provisional'
      ? `📋 *Provisional Receipt*\n${data.receiptNumber}\n\n👤 ${data.customerName}\n📱 ${data.customerPhone}\n📦 ${data.productName} (${data.brand})\n🔢 SN: ${data.serialNumber}\n💰 ₹${data.agreedPrice.toLocaleString('en-IN')}\n📍 ${data.sourceType === 'pickup' ? 'Online Pickup' : `Showroom: ${data.showroomName}`}\n👨‍💼 ${data.staffName}`
      : `✅ *Final Bill*\n${data.receiptNumber}\n\n👤 ${data.customerName}\n📦 ${data.productName}\n💰 ₹${data.agreedPrice.toLocaleString('en-IN')}\n🔍 QC: ${data.qcDecision}\n${data.qcNotes ? `📝 ${data.qcNotes}` : ''}`

    await fetch(`${baseUrl}/api/telegram/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    })
  } catch (err) {
    console.error('Telegram notification failed:', err)
  }
}
