// WidgetContainer.tsx
import React, { Suspense } from "react";
import type { Widget, WidgetData } from "@/app/types/widget";
import Loader from "@/components/ui/loader";
import { Card } from "@/components/ui/card";

/**@ts-ignore */
import widgets from "virtual:widgets";

interface WidgetProps {
  data: Widget;
}

const WidgetPosition: React.FC<WidgetProps> = ({ data }) => {
  const { title, description, path, position, span } = data;
  const columnSpan = span?.column || 1; // Correctly access span.column
  const rowSpan = span?.row || 1;       // Correctly access span.row

  const widgetStyle: React.CSSProperties = {
    gridColumnStart: position.column,
    gridColumnEnd: `span ${columnSpan}`,
    gridRowStart: position.row,
    gridRowEnd: `span ${rowSpan}`,
  };

  const Component = React.lazy(async () => {
    const value = await import(/* @vite-ignore */ path);
    return value;
  });

  return (
    <Card
      className="
        overflow-hidden
        flex items-center justify-center
        rounded shadow-none
        p-4
      "
      style={widgetStyle}
    >
      <Suspense fallback={<Loader />}>
        <Component />
      </Suspense>
    </Card>
  );
};

const WidgetContainer: React.FC = () => {
  return (
    <div
      className="
        flex-grow
        min-w-full
        grid
        grid-cols-12              /* Base: 12 columns */
        auto-rows-[minmax(150px,auto)] /* Equivalent to grid-auto-rows: minmax(150px, auto) */
        gap-4                     /* 16px gap */
      "
    >
      {(widgets as Array<Widget>).map((widget) => (
        <WidgetPosition key={widget.name} data={widget} />
      ))}
    </div>
  );
};
export default WidgetContainer;
