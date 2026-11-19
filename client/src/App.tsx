import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Billing from "@/pages/Billing";
import Invoices from "@/pages/Invoices";
import Customers from "@/pages/Customers";
import Ledger from "@/pages/Ledger";
import Payments from "@/pages/Payments";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import InvoiceEdit from "./pages/InvoiceEdit";
import InvoiceView from "./pages/InvoiceView";
import AdminFeatures from "./pages/admin/AdminFeatures";
import RequireAdmin from "./components/auth/RequireAdmin";
import AdminLogin from "./pages/admin/AdminLogin";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/admin" element={<AdminLogin />} />
          <Route
            path="/admin/features"
            element={
              <RequireAdmin>
                <AdminFeatures />
              </RequireAdmin>
            }
          />
        </Routes>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/invoices" element={<Invoices />} />
            {/* <Route path="/invoices/:id" element={<InvoiceDetail />} /> */}
            <Route path="/invoices/:id" element={<InvoiceView />} />
            <Route path="/invoices/:id/edit" element={<InvoiceEdit />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/ledger" element={<Ledger />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />

            {/* <Route path="*" element={<Navigate to="/" />} /> */}
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
