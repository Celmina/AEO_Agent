import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
}

interface NavItemProps {
  href: string;
  icon: string;
  label: string;
  isActive: boolean;
}

function NavItem({ href, icon, label, isActive }: NavItemProps) {
  return (
    <Link href={href}>
      <a className={cn(
        "flex items-center px-2 py-2 text-base rounded-md group transition-colors",
        isActive 
          ? "bg-dark-secondary text-white" 
          : "text-gray-300 hover:bg-dark-secondary hover:text-white"
      )}>
        <i className={`${icon} mr-3 h-6 w-6`}></i>
        {label}
      </a>
    </Link>
  );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const initials = user?.email 
    ? user.email.substring(0, 2).toUpperCase() 
    : "US";
    
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div 
        className={cn(
          "fixed inset-y-0 left-0 w-64 bg-dark z-30 transition-transform transform", 
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 bg-dark-secondary">
          <div className="flex items-center">
            <span className="text-white font-bold text-xl">MarkSync</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)} 
            className="text-gray-400 hover:text-white md:hidden"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="px-2 py-4">
          <nav className="space-y-1">
            <NavItem 
              href="/dashboard" 
              icon="fas fa-tachometer-alt" 
              label="Dashboard" 
              isActive={location === "/dashboard"} 
            />
            <NavItem 
              href="/campaigns" 
              icon="fas fa-envelope" 
              label="Email Campaigns" 
              isActive={location === "/campaigns"} 
            />
            <NavItem 
              href="/audience" 
              icon="fas fa-users" 
              label="Audience" 
              isActive={location === "/audience"} 
            />
            <NavItem 
              href="/analytics" 
              icon="fas fa-chart-line" 
              label="Analytics" 
              isActive={location === "/analytics"} 
            />
            <NavItem 
              href="/settings" 
              icon="fas fa-cog" 
              label="Settings" 
              isActive={location === "/settings"} 
            />
            <NavItem 
              href="/integrations" 
              icon="fas fa-plug" 
              label="Integrations" 
              isActive={location === "/integrations"} 
            />
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64">
        {/* Top navbar */}
        <div className="bg-white shadow-sm sticky top-0 z-20">
          <div className="flex items-center justify-between h-16 px-4 md:px-8">
            <div className="flex items-center">
              <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="text-gray-500 md:hidden"
              >
                <i className="fas fa-bars"></i>
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <button className="bg-gray-200 p-2 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                <i className="fas fa-bell"></i>
              </button>
              <div className="relative">
                <div className="flex items-center space-x-2">
                  <Avatar>
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline-block font-medium text-gray-700">
                    {user?.email}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={logout}
                    className="hidden md:flex"
                  >
                    <i className="fas fa-sign-out-alt ml-1"></i>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6 px-4 sm:px-6 md:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
