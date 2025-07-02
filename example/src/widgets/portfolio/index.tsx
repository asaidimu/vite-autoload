import type { WidgetData } from "@/app/types/widget"

export default function PortfolioOverview() {
    return <h2>Portfolio</h2>
}


export const metadata: WidgetData = {
    title: "Hello, Widget",
    description: "A sample widget",
    name: "portfolio",
    position: {
        row: 1,
        column: 1
    },
    span :{
        column: 3
    }
}

