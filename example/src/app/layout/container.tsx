// WidgetContainer.tsx
import type { Widget } from "@/app/types/widget";
import { Card } from "@/components/ui/card";
import Loader from "@/components/ui/loader";
import React, { Suspense } from "react";

/**@ts-ignore */
import widgets from "virtual:widgets";

interface WidgetProps {
  data: Widget;
}

const WidgetPosition: React.FC<WidgetProps> = ({ data }) => {
  const { path, position, span } = data;
  const columnSpan = span?.column || 1; // Correctly access span.column
  const rowSpan = span?.row || 1; // Correctly access span.row

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
        h-full
        relative
        flex-grow
        min-w-full
        grid
        grid-cols-12
        auto-rows-[minmax(150px,auto)]
        gap-4
      "
    >
      {(widgets as Array<Widget>).map((widget) => (
        <WidgetPosition key={widget.name} data={widget} />
      ))}
    </div>
  );
};
export default WidgetContainer;
