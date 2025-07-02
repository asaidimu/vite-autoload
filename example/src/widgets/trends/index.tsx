import type { WidgetData } from "@/app/types/widget"
import { ChartAreaInteractive } from "./component"

export default function TrendsOverview() {
    return <ChartAreaInteractive/>
}

export const metadata: WidgetData = {
    title: "Trends Widget",
    description: "Displays a graph",
    name: "trends",
    position: {
        row: 2,
        column: 1
    },
    span :{
        column: 8,
        row: 3
    }
}

