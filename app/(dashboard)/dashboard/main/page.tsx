"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Search, History, AlertTriangle } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';


export default function DashboardPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get the userId from the cookie
    const userId = getCookie('userId');
    if (userId !== null) {
      setUserId(userId as unknown as string); // Set the userId in state
    } else {
      // Redirect to login if the userId is not found
      router.push('/login');
    }
    console.log(userId)
  }, [router])

    useEffect(() => {
        const isAuthenticated = localStorage.getItem('isAuthenticated');
        console.log(isAuthenticated)
        if (!isAuthenticated) {
            router.push('/'); // Redirect to login if not authenticated
        }
    }, []);
  const stats = [
    {
      title: "Total Scans",
      value: "24",
      icon: <Search className="w-6 h-6" />,
      description: "Last 30 days",
    },
    {
      title: "High Risk Issues",
      value: "7",
      icon: <AlertTriangle className="w-6 h-6 text-red-500" />,
      description: "Requires immediate attention",
    },
    {
      title: "Active Sessions",
      value: "3",
      icon: <Shield className="w-6 h-6 text-green-500" />,
      description: "Currently running",
    },
    {
      title: "Completed Reports",
      value: "21",
      icon: <History className="w-6 h-6 text-blue-500" />,
      description: "Ready to view",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No recent activity to display.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Start a new scan or view recent reports.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// utils/getCookie.ts
export const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};


