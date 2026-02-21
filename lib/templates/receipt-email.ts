export interface ReceiptData {
  receiptNumber: string
  receiptType: 'provisional' | 'final'
  date: string
  sourceType: 'pickup' | 'showroom_walkin'
  showroomName?: string
  customerName: string
  customerPhone: string
  customerEmail: string
  productName: string
  brand: string
  category: string
  serialNumber: string
  agreedPrice: number
  staffName: string
  qcDecision?: string
  qcNotes?: string
}

export function generateProvisionalReceiptHTML(data: ReceiptData): string {
  const source = data.sourceType === 'pickup' ? 'Online Pickup' : `Showroom Walk-in (${data.showroomName || 'Showroom'})`
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f4f4f7;">
  <div style="max-width: 560px; margin: 0 auto; padding: 24px;">
    <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
      <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding: 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Provisional Receipt</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 13px;">Pending Quality Check</p>
      </div>
      <div style="padding: 24px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <div><strong style="color: #6b7280; font-size: 12px; text-transform: uppercase;">Receipt No</strong><br/><span style="font-size: 14px; font-weight: 600;">${data.receiptNumber}</span></div>
          <div style="text-align: right;"><strong style="color: #6b7280; font-size: 12px; text-transform: uppercase;">Date</strong><br/><span style="font-size: 14px;">${data.date}</span></div>
        </div>
        <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <strong style="color: #6b7280; font-size: 12px; text-transform: uppercase;">Source</strong>
          <p style="margin: 4px 0 0; font-size: 14px;">${source}</p>
        </div>
        <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <strong style="color: #6b7280; font-size: 12px; text-transform: uppercase;">Customer</strong>
          <p style="margin: 4px 0 0; font-size: 14px;">${data.customerName}</p>
          <p style="margin: 2px 0 0; font-size: 13px; color: #6b7280;">${data.customerPhone} &middot; ${data.customerEmail}</p>
        </div>
        <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <strong style="color: #6b7280; font-size: 12px; text-transform: uppercase;">Product</strong>
          <p style="margin: 4px 0 0; font-size: 14px; font-weight: 600;">${data.productName}</p>
          <p style="margin: 2px 0 0; font-size: 13px; color: #6b7280;">${data.brand} &middot; ${data.category}</p>
          <p style="margin: 2px 0 0; font-size: 13px; color: #6b7280;">Serial: ${data.serialNumber}</p>
        </div>
        <div style="background: #ecfdf5; border-radius: 8px; padding: 16px; margin-bottom: 16px; text-align: center;">
          <strong style="color: #6b7280; font-size: 12px; text-transform: uppercase;">Agreed Price</strong>
          <p style="margin: 4px 0 0; font-size: 24px; font-weight: 700; color: #059669;">₹${data.agreedPrice.toLocaleString('en-IN')}</p>
        </div>
        <p style="font-size: 12px; color: #6b7280; text-align: center;">Handled by: ${data.staffName}</p>
        <div style="border-top: 1px solid #e5e7eb; margin-top: 20px; padding-top: 16px;">
          <p style="font-size: 12px; color: #9ca3af; text-align: center;">This is a provisional receipt. A final bill will be issued after quality review.</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`
}

export function generateFinalReceiptHTML(data: ReceiptData): string {
  const source = data.sourceType === 'pickup' ? 'Online Pickup' : `Showroom Walk-in (${data.showroomName || 'Showroom'})`
  const decisionLabels: Record<string, string> = {
    service_station: 'Sent to Service Station',
    showroom: 'Ready for Showroom',
    warehouse: 'Sent to Warehouse',
  }
  const decisionLabel = data.qcDecision ? (decisionLabels[data.qcDecision] || data.qcDecision) : 'Reviewed'

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f4f4f7;">
  <div style="max-width: 560px; margin: 0 auto; padding: 24px;">
    <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
      <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Final Bill</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 13px;">Device Accepted & Processed</p>
      </div>
      <div style="padding: 24px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <div><strong style="color: #6b7280; font-size: 12px; text-transform: uppercase;">Receipt No</strong><br/><span style="font-size: 14px; font-weight: 600;">${data.receiptNumber}</span></div>
          <div style="text-align: right;"><strong style="color: #6b7280; font-size: 12px; text-transform: uppercase;">Date</strong><br/><span style="font-size: 14px;">${data.date}</span></div>
        </div>
        <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <strong style="color: #6b7280; font-size: 12px; text-transform: uppercase;">Source</strong>
          <p style="margin: 4px 0 0; font-size: 14px;">${source}</p>
        </div>
        <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <strong style="color: #6b7280; font-size: 12px; text-transform: uppercase;">Customer</strong>
          <p style="margin: 4px 0 0; font-size: 14px;">${data.customerName}</p>
          <p style="margin: 2px 0 0; font-size: 13px; color: #6b7280;">${data.customerPhone} &middot; ${data.customerEmail}</p>
        </div>
        <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <strong style="color: #6b7280; font-size: 12px; text-transform: uppercase;">Product</strong>
          <p style="margin: 4px 0 0; font-size: 14px; font-weight: 600;">${data.productName}</p>
          <p style="margin: 2px 0 0; font-size: 13px; color: #6b7280;">${data.brand} &middot; ${data.category}</p>
          <p style="margin: 2px 0 0; font-size: 13px; color: #6b7280;">Serial: ${data.serialNumber}</p>
        </div>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <strong style="color: #6b7280; font-size: 12px; text-transform: uppercase;">QC Decision</strong>
          <p style="margin: 4px 0 0; font-size: 14px; font-weight: 600; color: #059669;">${decisionLabel}</p>
          ${data.qcNotes ? `<p style="margin: 4px 0 0; font-size: 13px; color: #6b7280;">${data.qcNotes}</p>` : ''}
        </div>
        <div style="background: #ecfdf5; border-radius: 8px; padding: 16px; margin-bottom: 16px; text-align: center;">
          <strong style="color: #6b7280; font-size: 12px; text-transform: uppercase;">Final Amount</strong>
          <p style="margin: 4px 0 0; font-size: 24px; font-weight: 700; color: #059669;">₹${data.agreedPrice.toLocaleString('en-IN')}</p>
        </div>
        <p style="font-size: 12px; color: #6b7280; text-align: center;">Handled by: ${data.staffName}</p>
        <div style="border-top: 1px solid #e5e7eb; margin-top: 20px; padding-top: 16px;">
          <p style="font-size: 12px; color: #9ca3af; text-align: center;">Your device has been accepted and processed. Thank you for choosing us!</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`
}

export function generateReceiptHTML(data: ReceiptData): string {
  if (data.receiptType === 'final') {
    return generateFinalReceiptHTML(data)
  }
  return generateProvisionalReceiptHTML(data)
}
