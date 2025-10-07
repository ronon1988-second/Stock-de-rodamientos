
"use client";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { Sector, Machine, UsageLog } from "@/lib/types";

type UsageChartProps = {
  usageData: UsageLog[];
  sectors: Sector[];
  machinesBySector: Record<string, Machine[]>;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1919', '#4CAF50', '#F44336', '#9C27B0', '#3F51B5'];


export default function UsageChart({ usageData, sectors }: UsageChartProps) {
    
    const dataBySector = sectors.reduce((acc, sector) => {
        acc[sector.name] = 0;
        return acc;
    }, {} as Record<string, number>);

    usageData.forEach(log => {
        const sector = sectors.find(s => s.id === log.sectorId);
        if (sector && dataBySector.hasOwnProperty(sector.name)) {
            dataBySector[sector.name] += log.quantity;
        }
    });
    
    const chartData = Object.entries(dataBySector)
      .map(([name, usage]) => ({ name, usage }))
      .filter(d => d.usage > 0)
      .sort((a,b) => b.usage - a.usage);

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
