import type { WidgetData } from "@/app/types/widget"
import data from "./data.json"
import { DataTable } from "./component"
export default function TrendsOverview() {
    return  <DataTable data={data} />
}

export const metadata: WidgetData = {
    title: "Hello Widget",
    description: "A sample widget",
    name: "lists",
    position: {
        row: 2,
        column: 9
    },
    span :{
        column: 4,
        row: 3
    }
}

