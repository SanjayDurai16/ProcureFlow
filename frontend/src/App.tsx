import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppSidebar, type NavItemKey } from './components/AppSidebar';
import { AppHeader } from './components/AppHeader';
import { BuyerDashboard } from './components/BuyerDashboard';
import { VendorDashboard } from './components/VendorDashboard';
import { OrdersView } from './components/OrdersView';
import { AuthModal } from './components/AuthModal';
import { CreateRFQModal } from './components/CreateRFQModal';

const MainShell: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentNav, setCurrentNav] = useState<NavItemKey>('overview');
  const [initialOrderId, setInitialOrderId] = useState<string | null>(null);
  const [showCreateRfqModal, setShowCreateRfqModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F5] text-[#202522] text-xs">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full border-2 border-[#245C46] border-t-transparent animate-spin" />
          <span>Connecting to ProcureFlow engine...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthModal />;
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshKey((k) => k + 1);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleOpenOrder = (orderId?: string) => {
    if (orderId) setInitialOrderId(orderId);
    setCurrentNav('orders');
  };

  // Breadcrumbs generator
  const getBreadcrumbs = () => {
    const rolePrefix = user.role === 'BUYER' ? 'Buyer Workspace' : 'Vendor Portal';

    const pageLabels: Record<NavItemKey, string> = {
      overview: 'Overview',
      rfqs: 'My RFQs',
      quotations: 'Quotations',
      regional_rfqs: 'Regional Feed',
      my_quotes: 'My Quotations',
      orders: 'Purchase Orders',
    };

    return ['ProcureFlow', rolePrefix, pageLabels[currentNav] || 'Overview'];
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex text-[#202522]">
      {/* 228px Left Sidebar */}
      <AppSidebar
        currentNav={currentNav}
        onNavigate={(key) => {
          setCurrentNav(key);
          if (key !== 'orders') setInitialOrderId(null);
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          breadcrumbs={getBreadcrumbs()}
          actionLabel={user.role === 'BUYER' ? 'Create RFQ' : undefined}
          onActionClick={() => setShowCreateRfqModal(true)}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          {currentNav === 'orders' && (
            <OrdersView
              key={refreshKey}
              user={user}
              initialSelectedOrderId={initialOrderId}
            />
          )}

          {user.role === 'BUYER' && currentNav !== 'orders' && (
            <BuyerDashboard
              key={refreshKey}
              user={user}
              subView={currentNav === 'quotations' ? 'quotations' : currentNav === 'rfqs' ? 'rfqs' : 'overview'}
              onNavigateToOrders={handleOpenOrder}
              onNavigateToRFQs={() => setCurrentNav('rfqs')}
              onNavigateToQuotations={() => setCurrentNav('quotations')}
            />
          )}

          {user.role === 'VENDOR' && currentNav !== 'orders' && (
            <VendorDashboard
              key={refreshKey}
              user={user}
              subView={currentNav === 'my_quotes' ? 'my_quotes' : currentNav === 'regional_rfqs' ? 'regional_rfqs' : 'overview'}
              onNavigateToFeed={() => setCurrentNav('regional_rfqs')}
              onNavigateToQuotes={() => setCurrentNav('my_quotes')}
              onNavigateToOrders={() => setCurrentNav('orders')}
            />
          )}
        </main>
      </div>

      {/* Global Create RFQ Modal for Buyer */}
      {showCreateRfqModal && (
        <CreateRFQModal
          userRegion={user.region}
          onClose={() => setShowCreateRfqModal(false)}
          onCreated={() => {
            setShowCreateRfqModal(false);
            setCurrentNav('rfqs');
            handleRefresh();
          }}
        />
      )}
    </div>
  );
};

export default function App(): React.JSX.Element {
  return (
    <AuthProvider>
      <MainShell />
    </AuthProvider>
  );
}
