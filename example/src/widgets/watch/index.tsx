import type { WidgetData } from "@/app/types/widget"

export default function WatchList() {
    return <h2>WatchList</h2>
}


export const metadata: WidgetData = {
    title: "Hello, Widget",
    description: "A sample widget",
    name: "watch",
    position: {
        row: 1,
        column: 4
    },
    span :{
        column: 9
    }
}

