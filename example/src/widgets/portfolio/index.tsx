import type { WidgetData } from "@/app/types/widget"
import PortfolioOverview from "./component"

export default PortfolioOverview

export const metadata: WidgetData = {
    title: "Partfolio Widget",
    description: "A sample widget",
    name: "portfolio",
    position: {
        row: 1,
        column: 1
    },
    span :{
        column: 4,
    }
}

