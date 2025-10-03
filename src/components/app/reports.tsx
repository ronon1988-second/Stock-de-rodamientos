"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import type { Bearing, UsageLog } from "@/lib/types";
import UsageChart from "./usage-chart";

type ReportsProps = {
  bearings: Bearing[];
  usageLog: UsageLog[];
};

export default function Reports({ bearings, usageLog }: ReportsProps) {
  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Usage by Sector</CardTitle>
          <CardDescription>
            Visual representation of bearing consumption per sector.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsageChart usageData={usageLog} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Usage History</CardTitle>
          <CardDescription>A detailed log of all bearing usage.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bearing</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usageLog.length > 0 ? (
                usageLog.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      {log.bearingName}
                    </TableCell>
                    <TableCell>{log.sector}</TableCell>
                    <TableCell className="text-right">{log.quantity}</TableCell>
                    <TableCell>
                      {format(new Date(log.date), "PPP p")}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No usage data available.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
