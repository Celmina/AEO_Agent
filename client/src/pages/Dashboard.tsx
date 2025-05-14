import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardStatsCard } from "@/components/DashboardStatsCard";
import { WebsiteConnection } from "@/components/website/WebsiteConnection";
import { CampaignTable, Campaign } from "@/components/CampaignTable";
import { EngagementChart } from "@/components/charts/EngagementChart";
import { AudienceGrowthChart } from "@/components/charts/AudienceGrowthChart";
import { useAuth } from "@/hooks/use-auth";

// Sample data for the dashboard
const engagementData = [
  { name: 'Jan', opens: 30, clicks: 10, conversions: 5 },
  { name: 'Feb', opens: 35, clicks: 12, conversions: 6 },
  { name: 'Mar', opens: 40, clicks: 15, conversions: 7 },
  { name: 'Apr', opens: 32, clicks: 11, conversions: 5 },
  { name: 'May', opens: 38, clicks: 13, conversions: 6 },
  { name: 'Jun', opens: 42, clicks: 17, conversions: 8 },
  { name: 'Jul', opens: 45, clicks: 18, conversions: 9 },
];

const audienceData = [
  { name: 'Jan', subscribers: 500, unsubscribes: 20 },
  { name: 'Feb', subscribers: 700, unsubscribes: 30 },
  { name: 'Mar', subscribers: 900, unsubscribes: 40 },
  { name: 'Apr', subscribers: 1200, unsubscribes: 50 },
  { name: 'May', subscribers: 1500, unsubscribes: 60 },
  { name: 'Jun', subscribers: 1800, unsubscribes: 70 },
];

const campaignsData: Campaign[] = [
  {
    id: '1',
    title: 'Summer Sale Announcement',
    type: 'Email Campaign',
    status: 'completed',
    openRate: 28.4,
    clickRate: 6.2,
    sentDate: '2 days ago',
  },
  {
    id: '2',
    title: 'New Product Launch',
    type: 'Email Campaign',
    status: 'completed',
    openRate: 32.1,
    clickRate: 8.7,
    sentDate: '5 days ago',
  },
  {
    id: '3',
    title: 'Weekly Newsletter',
    type: 'Email Campaign',
    status: 'in-progress',
    openRate: 18.9,
    clickRate: 4.1,
    sentDate: '1 day ago',
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [siteId, setSiteId] = useState("site_1a2b3c4d5e");
  
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-gray-600">Welcome back! Here's an overview of your marketing performance.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardStatsCard
          icon="fas fa-users"
          iconColor="primary"
          title="Total Subscribers"
          value="12,496"
          change={8.2}
        />
        <DashboardStatsCard
          icon="fas fa-envelope-open"
          iconColor="secondary"
          title="Open Rate"
          value="24.3%"
          change={2.1}
        />
        <DashboardStatsCard
          icon="fas fa-mouse-pointer"
          iconColor="accent"
          title="Click Rate"
          value="5.4%"
          change={-0.5}
        />
        <DashboardStatsCard
          icon="fas fa-shopping-cart"
          iconColor="success"
          title="Conversion Rate"
          value="2.8%"
          change={1.2}
        />
      </div>

      {/* Charts */}
      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <EngagementChart data={engagementData} />
        <AudienceGrowthChart data={audienceData} />
      </div>

      {/* Recent Campaigns */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Recent Campaigns</h2>
          <Link href="/campaigns">
            <Button variant="link" className="text-primary hover:text-primary/80">
              View all
              <i className="fas fa-arrow-right ml-1"></i>
            </Button>
          </Link>
        </div>
        <CampaignTable campaigns={campaignsData} />
      </div>

      {/* Website Integration */}
      <div className="mt-8">
        <WebsiteConnection
          domain="yourwebsite.com"
          siteId={siteId}
          isActive={true}
          onEditClick={() => {}}
          onSettingsClick={() => {}}
        />
      </div>
    </DashboardLayout>
  );
}
