"use client";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1919'];


export default function UsageChart({ usageData }: UsageChartProps) {
    const isBySector = usageData.every(log => SECTORS.includes(log.sector));

    let chartData: { name: string, usage: number }[];

    if (isBySector) {
        // Aggregate by sector
        const dataBySector = SECTORS.reduce((acc, sector) => {
            acc[sector] = 0;
            return acc;
        }, {} as Record<Sector, number>);

        usageData.forEach(log => {
            if (log.sector && dataBySector.hasOwnProperty(log.sector)) {
                dataBySector[log.sector] += log.quantity;
            }
        });
        chartData = Object.entries(dataBySector).map(([name, usage]) => ({ name, usage })).filter(d => d.usage > 0);
    } else {
        // Aggregate by item name
        const dataByItem = usageData.reduce((acc, log) => {
            if (!acc[log.itemName]) {
                acc[log.itemName] = 0;
            }
            acc[log.itemName] += log.quantity;
            return acc;
        }, {} as { [key: string]: number });
        chartData = Object.entries(dataByItem).map(([name, usage]) => ({ name, usage })).sort((a,b) => b.usage - a.usage).slice(0, 10);
    }

  if (chartData.length === 0) {
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
          <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" hide />
            <YAxis 
                dataKey="name" 
                type="category" 
                tickLine={false} 
                axisLine={false} 
                tick={{ fontSize: 12 }}
                width={120}
                interval={0}
             />
            <Tooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                content={<ChartTooltipContent />}
            />
            <Bar dataKey="usage" layout="vertical" fill="hsl(var(--primary))" radius={4}>
                {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
