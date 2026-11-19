import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  FileText,
  Users,
  Book,
  CreditCard,
  Settings as SettingsIcon,
  PlusCircle,
  Menu,
  X,
  Receipt,
} from "lucide-react";
import logo from "../asset/image/Cybill.png";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const location = useLocation();

  const menuItems = [
    { path: "/", icon: BarChart3, label: "Dashboard" },
    { path: "/billing", icon: PlusCircle, label: "New Bill" },
    { path: "/invoices", icon: FileText, label: "All Bills" },
    { path: "/customers", icon: Users, label: "Customers" },
    { path: "/ledger", icon: Book, label: "Customer Ledger" },
    { path: "/payments", icon: CreditCard, label: "Payments" },
    { path: "/reports", icon: BarChart3, label: "Reports" },
    { path: "/settings", icon: SettingsIcon, label: "Settings" },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* SIDEBAR */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-[76px]"
        } flex flex-col border-r border-slate-200 bg-white transition-all duration-300`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-4">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-50">
                <img
                  src={logo}
                  alt="Cybill"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-bold text-slate-900">Cybill</p>
                <p className="text-[10px] text-slate-400">GST Billing Suite</p>
              </div>
            </div>
          )}

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                title={!sidebarOpen ? item.label : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                } ${!sidebarOpen ? "justify-center" : ""}`}
              >
                <Icon size={19} className={isActive ? "text-indigo-600" : ""} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {sidebarOpen && (
          <div className="border-t border-slate-200 p-4 text-[11px] text-slate-400">
            © {new Date().getFullYear()} Cybill
          </div>
        )}
      </aside>

      {/* CONTENT */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

export default Layout;
