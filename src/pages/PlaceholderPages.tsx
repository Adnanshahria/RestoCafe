const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
    <h1 className="text-2xl font-bold mb-2">{title}</h1>
    <p className="text-muted-foreground">This page will be built in the next phase.</p>
  </div>
);

export const OrdersPage = () => <PlaceholderPage title="Orders" />;
export const MenuPage = () => <PlaceholderPage title="Menu Management" />;
export const InvoicesPage = () => <PlaceholderPage title="Invoices" />;
export const FinancePage = () => <PlaceholderPage title="Finance" />;
export const CustomersPage = () => <PlaceholderPage title="Customers" />;
export const AnalyticsPage = () => <PlaceholderPage title="Analytics" />;
export const SettingsPage = () => <PlaceholderPage title="Settings" />;
