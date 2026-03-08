import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Printer, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { mockInvoices, mockOrders } from '@/data/mock-data';
import { Invoice, Order } from '@/types';

const InvoicesPage = () => {
  const [invoices] = useState<Invoice[]>(() => {
    // Generate invoices from completed orders
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
              <div className="text-center">
                <h3 className="font-bold text-lg">RestoCafe</h3>
                <p className="text-xs text-muted-foreground">123 Restaurant Ave · (555) 123-4567</p>
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
              <p className="text-xs text-center text-muted-foreground">Payment: {selectedInvoice.paymentMethod} · {new Date(selectedInvoice.createdAt).toLocaleString()}</p>
              <Button variant="outline" className="w-full no-print" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-1" /> Print Receipt
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoicesPage;
