"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ReferenceLine } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { api } from "@/convex/_generated/api"
import { useMutation, useQuery } from "convex/react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

const chartConfig = {
  price: {
    label: "Price",
    color: "var(--chart-2)",
  },
  date: {
    label: "Date",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export interface ChartAreaInteractiveProps {
  data: {
    date: string
    price: number
    synthetic?: boolean
  }[]
  teamMembers: string
  teamName: string
  teamImages: string[]
}

function isErrorWithMessage(error: unknown): error is { message: string } {
  console.log(error)
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as Record<string, unknown>)["message"] === "string"
  );
}

export function ChartAreaInteractive({ data, teamMembers, teamName, teamImages, showBuySellLines = true, timeRange = "all" }: ChartAreaInteractiveProps & { showBuySellLines?: boolean, timeRange?: string }) {
  const [amount, setAmount] = React.useState("")
  const buyTickerMutation = useMutation(api.myFunctions.buyTicker)
  const sellTickerMutation = useMutation(api.myFunctions.sellTicker)
  const currentHoldings = useQuery(api.myFunctions.getCurrentHoldings, {
    ticker: teamName,
  })

  const filteredData = data.filter((item) => {
    if (timeRange === "all") return true;
    const date = new Date(item.date)
    const referenceDate = new Date()
    let msToSubtract = 0
    if (timeRange === "1hr") {
      msToSubtract = 60 * 60 * 1000 // 1 hour in ms
    } else if (timeRange === "24hrs") {
      msToSubtract = 24 * 60 * 60 * 1000 // 24 hours in ms
    }
    const startDate = new Date(referenceDate.getTime() - msToSubtract)
    return date >= startDate
  })


  // Determine chart color based on price trend
  let chartColor = "var(--color-Price)";
  let fillId = "fillPrice";
  if (filteredData.length > 1) {
    const startPrice = filteredData[0].price;
    const endPrice = filteredData[filteredData.length - 1].price;
    if (endPrice < startPrice) {
      chartColor = "#ef4444"; // red-500
      fillId = "fillRed";
    } else {
      chartColor = "#22c55e"; // green-500
      fillId = "fillGreen";
    }
  }

  // Calculate min/max for Y axis zoom
  let yMin = -0.5;
  let yMax = 0.5;
  if (filteredData.length > 0) {
    yMin = Math.min(...filteredData.map(d => d.price));
    yMax = Math.max(...filteredData.map(d => d.price));
    // Add padding (5% of range or 1 if range is 0)
    const range = yMax - yMin || 1;
    const pad = range * 0.05;
    yMin = yMin - pad;
    yMax = yMax + pad;
    // round to 2 decimal places
    yMin = Math.round(yMin * 100) / 100;
    yMax = Math.round(yMax * 100) / 100;
  }

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-y-2">
          <CardTitle className="text-2xl font-bold">${teamName} </CardTitle>
          <CardDescription>
            {teamMembers}
          </CardDescription>
          {filteredData.length > 0 && (
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${
                filteredData.length > 1 && 
                filteredData[filteredData.length - 1].price < filteredData[0].price 
                  ? 'text-red-600' 
                  : 'text-green-600'
              }`}>
                {filteredData[filteredData.length - 1].price.toFixed(3)} BRDG
              </span>
              <span className="text-sm text-gray-500">per token</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-y-4 items-end">
        <div className="flex flex-row gap-2 mb-1">
              {teamImages && teamImages.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Team member ${idx + 1}`}
                  className="w-8 h-8 rounded-full object-cover border border-gray-200"
                />
              ))}
            </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-desktop)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-desktop)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillGreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillRed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                if (timeRange === "1hr" || timeRange === "24hrs") {
                  return date.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })
                }
                // 'all' or fallback
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <YAxis
              dataKey="price"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              domain={[yMin, yMax]}
              tickFormatter={(value) => {
                return value.toFixed(2)
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    const date = new Date(value as string)
                    if (timeRange === "1hr" || timeRange === "24hrs") {
                      return date.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })
                    }
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            {showBuySellLines && filteredData.map((point, idx) => {
              if (idx === 0) return null;
              const prev = filteredData[idx - 1];
              // Only draw if both points are not synthetic
              if (point.synthetic || prev.synthetic) return null;
              const delta = point.price - prev.price;
              if (delta === 0) return null;
              return (
                <ReferenceLine
                  key={point.date}
                  x={point.date}
                  stroke={delta > 0 ? "#22c55e" : "#ef4444"}
                  strokeDasharray="3 3"
                  strokeOpacity={0.4}
                  label={false}
                />
              );
            })}
            <Area
              dataKey="price"
              type="natural"
              fill={`url(#${fillId})`}
              stroke={chartColor}
              stackId="a"
            />
            <ChartLegend content={<ChartLegendContent payload={[]} verticalAlign="bottom" />} />
          </AreaChart>
        </ChartContainer>
        <div className="flex flex-row gap-2 justify-evenly mt-4 items-center">
          <Input className="w-52 text-center" placeholder="$BRDG Coins" value={amount} 
            onChange={(e) => {
              const val = e.target.value;
              // Allow empty string, or valid decimal number with up to 2 decimals
              if (val === "" || /^\d*\.?\d{0,2}$/.test(val)) {
                setAmount(val);
              }
            }}
            onBlur={() => {
              // Format to two decimals if not empty and is a valid number
              if (amount !== "" && !isNaN(Number(amount))) {
                setAmount(parseFloat(amount).toFixed(2));
              }
            }}
          />
          <Button className="bg-green-500 text-white hover:bg-green-500/90" onClick={async () => {
            // buy the ticker
            const amt = parseFloat(amount);
            if (!isNaN(amt) && amt > 0) {
              try {
                await buyTickerMutation({
                  ticker: teamName,
                  amount: amt,
                });
              } catch (error: unknown) {
                let message = "Failed to buy ticker.";
                if (isErrorWithMessage(error)) {
                  message = error.message;
                }
                toast.error(message);
              }
            }
          }}>Buy</Button>
          <Button variant="destructive" onClick={async () => {
            // sell the ticker
            const amt = parseFloat(amount);
            if (!isNaN(amt) && amt > 0) {
              try {
                await sellTickerMutation({
                  ticker: teamName,
                  amount: amt,
                });
              } catch (error: unknown) {
                let message = "Failed to sell ticker.";
                if (isErrorWithMessage(error)) {
                  message = error.message;
                }
                toast.error(message);
              }
            }
          }}>Sell</Button>
          <Badge  className="text-xs">Holdings: {Math.round((currentHoldings ?? 0) * 100) / 100}</Badge>
        </div>

      </CardContent>
    </Card>
  )
}
