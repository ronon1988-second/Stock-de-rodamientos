"use client";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
} from "@/components/ui/chart";
import type { Sector, UsageLog } from "@/lib/types";
import { SECTORS } from "@/lib/types";

type UsageChartProps = {
  usageData: UsageLog[];
};

export default function UsageChart({ usageData }: UsageChartProps) {
  const chartData = SECTORS.map((sector) => {
    const totalUsage = usageData
      .filter((log) => log.sector === sector)
      .reduce((sum, log) => sum + log.quantity, 0);
    return {
      name: sector,
      usage: totalUsage,
    };
  });
  
  if (usageData.length === 0) {
    return (
        <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
            No hay datos disponibles para el gráfico.
        </div>
    )
  }

  return (
    <div className="h-[300px] w-full">
       <ChartContainer config={{}} className="h-full w-full">
         <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                content={<ChartTooltipContent />}
            />
            <Legend content={<ChartLegend />} />
            <Bar dataKey="usage" fill="hsl(var(--primary))" radius={4} />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
