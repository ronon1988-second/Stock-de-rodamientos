"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  FileUp,
  Home,
  LineChart,
  Menu,
  Package,
  Package2,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Bearing, UsageLog } from "@/lib/types";
import { initialBearings } from "@/lib/data";
import Dashboard from "@/components/app/dashboard";
import Reports from "@/components/app/reports";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/app/logo";

type View = "dashboard" | "reports";

export default function App() {
  const [view, setView] = useState<View>("dashboard");
  const [bearings, setBearings] = useState<Bearing[]>([]);
  const [usageLog, setUsageLog] = useState<UsageLog[]>([]);
  const { toast } = useToast();

  const handleImportData = () => {
    setBearings(initialBearings);
    toast({
      title: "Data Imported",
      description: "Sample bearing stock data has been loaded.",
    });
  };

  const handleLogUsage = (bearingId: string, quantity: number) => {
    let updatedBearing: Bearing | undefined;
    setBearings((prevBearings) =>
      prevBearings.map((bearing) => {
        if (bearing.id === bearingId) {
          updatedBearing = { ...bearing, stock: bearing.stock - quantity };
          return updatedBearing;
        }
        return bearing;
      })
    );

    if (updatedBearing) {
      const newLog: UsageLog = {
        id: `usage-${Date.now()}`,
        bearingId: bearingId,
        bearingName: updatedBearing.name,
        quantity,
        date: new Date().toISOString(),
        sector: updatedBearing.sector,
      };
      setUsageLog((prevLogs) => [newLog, ...prevLogs]);

      if (
        updatedBearing.stock <= updatedBearing.threshold &&
        updatedBearing.stock + quantity > updatedBearing.threshold
      ) {
        toast({
          variant: "destructive",
          title: "Low Stock Alert",
          description: `${updatedBearing.name} in ${updatedBearing.sector} is running low.`,
        });
      }
    }
  };

  const lowStockCount = bearings.filter(
    (b) => b.stock <= b.threshold && b.stock > 0
  ).length;

  const NavLink = ({
    targetView,
    icon,
    label,
    badgeCount,
  }: {
    targetView: View;
    icon: React.ReactNode;
    label: string;
    badgeCount?: number;
  }) => (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        setView(targetView);
      }}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${
        view === targetView ? "bg-muted text-primary" : ""
      }`}
    >
      {icon}
      {label}
      {badgeCount !== undefined && badgeCount > 0 && (
        <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
          {badgeCount}
        </Badge>
      )}
    </a>
  );

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-card md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <a href="/" className="flex items-center gap-2 font-semibold">
              <Logo className="h-8 w-8 text-primary" />
              <span className="">Bearing Balance</span>
            </a>
            {lowStockCount > 0 && (
              <Button variant="outline" size="icon" className="ml-auto h-8 w-8">
                <Bell className="h-4 w-4" />
                <span className="sr-only">Toggle notifications</span>
              </Button>
            )}
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              <NavLink
                targetView="dashboard"
                icon={<Home className="h-4 w-4" />}
                label="Dashboard"
              />
              <NavLink
                targetView="reports"
                icon={<LineChart className="h-4 w-4" />}
                label="Reports"
              />
            </nav>
          </div>
          <div className="mt-auto p-4">
            <Card>
              <CardHeader className="p-2 pt-0 md:p-4">
                <CardTitle>Data Import</CardTitle>
                <CardDescription>
                  Load your bearing stock data from an Excel file to get
                  started.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2 pt-0 md:p-4 md:pt-0">
                <Button size="sm" className="w-full" onClick={handleImportData}>
                  <FileUp className="mr-2 h-4 w-4" />
                  Import Data
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                <a
                  href="#"
                  className="flex items-center gap-2 text-lg font-semibold mb-4"
                >
                  <Logo className="h-8 w-8 text-primary" />
                  <span className="sr-only">Bearing Balance</span>
                </a>
                <NavLink
                  targetView="dashboard"
                  icon={<Home className="h-5 w-5" />}
                  label="Dashboard"
                />
                <NavLink
                  targetView="reports"
                  icon={<LineChart className="h-5 w-5" />}
                  label="Reports"
                />
              </nav>
              <div className="mt-auto">
                <Card>
                  <CardHeader>
                    <CardTitle>Data Import</CardTitle>
                    <CardDescription>
                      Load your bearing stock data.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={handleImportData}
                    >
                      <FileUp className="mr-2 h-4 w-4" />
                      Import Data
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </SheetContent>
          </Sheet>

          <div className="w-full flex-1">
             <h1 className="font-semibold text-xl capitalize">{view}</h1>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Users className="h-5 w-5" />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {view === "dashboard" && (
            <Dashboard
              bearings={bearings}
              usageLog={usageLog}
              onLogUsage={handleLogUsage}
            />
          )}
          {view === "reports" && (
            <Reports bearings={bearings} usageLog={usageLog} />
          )}
          {bearings.length === 0 && view === "dashboard" && (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
              <div className="flex flex-col items-center gap-1 text-center">
                <h3 className="text-2xl font-bold tracking-tight">
                  No Bearing Data
                </h3>
                <p className="text-sm text-muted-foreground">
                  Import your data to start managing your inventory.
                </p>
                <Button className="mt-4" onClick={handleImportData}>
                  <FileUp className="mr-2 h-4 w-4" />
                  Import Data
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
