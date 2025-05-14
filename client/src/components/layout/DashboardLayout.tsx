import React, { ReactNode } from 'react';
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
      <div className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
        isActive 
          ? 'bg-primary text-white' 
          : 'hover:bg-gray-100'
      }`}>
        <i className={`${icon} w-5 h-5`}></i>
        <span>{label}</span>
      </div>
    </Link>
  );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  
  const navItems = [
    {
      href: "/dashboard",
      icon: "fas fa-tachometer-alt",
      label: "Dashboard",
      isActive: location === "/dashboard",
    },
    {
      href: "/chatbot-config",
      icon: "fas fa-robot",
      label: "Chatbot",
      isActive: location === "/chatbot-config",
    },
    {
      href: "/aeo-management",
      icon: "fas fa-search",
      label: "AEO Management",
      isActive: location === "/aeo-management",
    },
    {
      href: "/connect-website",
      icon: "fas fa-link",
      label: "Connect Website",
      isActive: location === "/connect-website",
    }
  ];
  
  const handleLogout = async () => {
    await logout();
  };
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-white border-r">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-primary">MarkSync</h1>
          <p className="text-xs text-gray-500">Chatbot & AEO Platform</p>
        </div>
        
        <div className="p-4">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavItem key={item.href} {...item} />
            ))}
          </nav>
        </div>
        
        <div className="p-4 border-t mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-white">
                  {user?.email ? user.email.substring(0, 2).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{user?.email || "User"}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}