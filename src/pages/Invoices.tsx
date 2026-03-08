import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileText, Printer, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { mockInvoices, mockOrders } from '@/data/mock-data';
import { Invoice, Order } from '@/types';
import jsPDF from 'jspdf';

const RESTAURANT = {
  name: 'RestoCafe',
  tagline: 'Fine Dining & Coffee',
  address: '123 Restaurant Ave, Suite 100',
  city: 'San Francisco, CA 94102',
  phone: '(555) 123-4567',
  email: 'hello@restocafe.com',
  website: 'www.restocafe.com',
  taxId: 'TAX-2024-00891',
  logoUrl: '/logo-restocafe.png',
};

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function generateReceiptPDF(invoice: Invoice) {
  const doc = new jsPDF({ unit: 'mm', format: [80, 200] }); // receipt-width
  const w = 80;
  let y = 6;
  const lm = 5; // left margin
  const rm = w - 5; // right edge

  // --- Logo ---
  try {
    const img = await loadImage(RESTAURANT.logoUrl);
    const logoW = 22;
    const logoH = (img.height / img.width) * logoW;
    doc.addImage(img, 'PNG', (w - logoW) / 2, y, logoW, logoH);
    y += logoH + 2;
  } catch {
    y += 2;
  }

  // --- Header ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(RESTAURANT.name, w / 2, y, { align: 'center' });
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100);
  doc.text(RESTAURANT.tagline, w / 2, y, { align: 'center' });
  y += 3;
  doc.text(RESTAURANT.address, w / 2, y, { align: 'center' });
  y += 3;
  doc.text(`${RESTAURANT.city} · ${RESTAURANT.phone}`, w / 2, y, { align: 'center' });
  y += 4;

  // --- Dashed line ---
  doc.setDrawColor(180);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(lm, y, rm, y);
  y += 4;

  // --- Invoice info ---
  doc.setTextColor(60);
  doc.setFontSize(7);
  doc.text(`Invoice #${invoice.id.slice(-4)}`, lm, y);
  doc.text(new Date(invoice.createdAt).toLocaleString(), rm, y, { align: 'right' });
  y += 3.5;
  doc.text(`Customer: ${invoice.customerName || 'Walk-in'}`, lm, y);
  doc.text(`Payment: ${invoice.paymentMethod.toUpperCase()}`, rm, y, { align: 'right' });
  y += 4;

  doc.line(lm, y, rm, y);
  y += 3;

  // --- Column headers ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(80);
  doc.text('ITEM', lm, y);
  doc.text('QTY', 50, y, { align: 'center' });
  doc.text('AMOUNT', rm, y, { align: 'right' });
  y += 3;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40);

  // --- Items ---
  invoice.items.forEach(item => {
    const name = item.menuItemName.length > 22
      ? item.menuItemName.slice(0, 21) + '…'
      : item.menuItemName;
    doc.text(name, lm, y);
    doc.text(`${item.quantity}`, 50, y, { align: 'center' });
    doc.text(`$${(item.quantity * item.unitPrice).toFixed(2)}`, rm, y, { align: 'right' });
    y += 3.5;
  });

  y += 1;
  doc.line(lm, y, rm, y);
  y += 4;

  // --- Totals ---
  doc.setFontSize(7);
  doc.setTextColor(80);
  doc.text('Subtotal', lm, y);
  doc.text(`$${invoice.subtotal.toFixed(2)}`, rm, y, { align: 'right' });
  y += 3.5;
  doc.text('Tax', lm, y);
  doc.text(`$${invoice.tax.toFixed(2)}`, rm, y, { align: 'right' });
  y += 3.5;
  if (invoice.discount > 0) {
    doc.text('Discount', lm, y);
    doc.text(`-$${invoice.discount.toFixed(2)}`, rm, y, { align: 'right' });
    y += 3.5;
  }
  doc.line(lm, y, rm, y);
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(20);
  doc.text('TOTAL', lm, y);
  doc.text(`$${invoice.total.toFixed(2)}`, rm, y, { align: 'right' });
  y += 6;

  // --- Footer ---
  doc.setLineDashPattern([1, 1], 0);
  doc.setDrawColor(180);
  doc.line(lm, y, rm, y);
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(120);
  doc.text('Thank you for dining with us!', w / 2, y, { align: 'center' });
  y += 3;
  doc.text(`${RESTAURANT.website} · ${RESTAURANT.email}`, w / 2, y, { align: 'center' });
  y += 3;
  doc.text(`Tax ID: ${RESTAURANT.taxId}`, w / 2, y, { align: 'center' });
  y += 3;
  doc.text('Powered by RestoCafe POS', w / 2, y, { align: 'center' });

  // Trim page height
  const pageHeight = y + 6;
  (doc as any).internal.pageSize.height = pageHeight;

  doc.save(`receipt-${invoice.id.slice(-4)}.pdf`);
}

const InvoicesPage = () => {
  const [invoices] = useState<Invoice[]>(() => {
    const completedOrders = mockOrders.filter(o => o.status === 'completed');
    const generated: Invoice[] = completedOrders.map(o => ({
      id: `inv-${o.id}`,
      orderId: o.id,
      customerName: o.customerName,
      items: o.items,
      subtotal: o.subtotal,
      tax: o.tax,
      discount: o.discount,
      total: o.total,
      paymentMethod: 'card' as const,
      createdAt: o.createdAt,
      paid: true,
    }));
    return [...mockInvoices, ...generated].filter((v, i, a) => a.findIndex(x => x.id === v.id) === i);
  });
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const handlePrint = () => window.print();
  const handleExportPDF = useCallback(() => {
    if (selectedInvoice) generateReceiptPDF(selectedInvoice);
  }, [selectedInvoice]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Invoices</h1>
        <p className="text-muted-foreground text-sm mt-1">{invoices.length} invoices</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {invoices.map((inv, i) => (
          <motion.div key={inv.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="border shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedInvoice(inv)}>
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">#{inv.id.slice(-4)}</span>
                  </div>
                  <Badge variant={inv.paid ? 'default' : 'destructive'} className="text-xs">
                    {inv.paid ? 'Paid' : 'Unpaid'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{inv.customerName || 'Walk-in'}</p>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{inv.items.length} items</span>
                  <span className="font-bold">${inv.total.toFixed(2)}</span>
                </div>
                <p className="text-xs text-muted-foreground">{new Date(inv.createdAt).toLocaleDateString()}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Receipt Dialog */}
      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invoice #{selectedInvoice?.id.slice(-4)}</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4" id="receipt">
              <div className="text-center space-y-1">
                <img src={RESTAURANT.logoUrl} alt="RestoCafe" className="h-12 mx-auto" />
                <h3 className="font-bold text-lg">{RESTAURANT.name}</h3>
                <p className="text-[11px] text-muted-foreground">{RESTAURANT.tagline}</p>
                <p className="text-xs text-muted-foreground">{RESTAURANT.address} · {RESTAURANT.phone}</p>
              </div>
              <Separator />
              <div className="space-y-1 text-sm">
                {selectedInvoice.items.map(item => (
                  <div key={item.id} className="flex justify-between">
                    <span>{item.quantity}× {item.menuItemName}</span>
                    <span>${(item.quantity * item.unitPrice).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>${selectedInvoice.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Tax</span><span>${selectedInvoice.tax.toFixed(2)}</span></div>
                {selectedInvoice.discount > 0 && <div className="flex justify-between text-primary"><span>Discount</span><span>-${selectedInvoice.discount.toFixed(2)}</span></div>}
                <div className="flex justify-between font-bold text-base"><span>Total</span><span>${selectedInvoice.total.toFixed(2)}</span></div>
              </div>
              <Separator />
              <div className="text-center space-y-0.5">
                <p className="text-xs text-muted-foreground">Payment: {selectedInvoice.paymentMethod} · {new Date(selectedInvoice.createdAt).toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground italic">Thank you for dining with us!</p>
                <p className="text-[10px] text-muted-foreground">{RESTAURANT.website} · Tax ID: {RESTAURANT.taxId}</p>
              </div>
              <div className="flex gap-2 no-print">
                <Button variant="outline" className="flex-1" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-1" /> Print
                </Button>
                <Button className="flex-1" onClick={handleExportPDF}>
                  <Download className="h-4 w-4 mr-1" /> Export PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoicesPage;
