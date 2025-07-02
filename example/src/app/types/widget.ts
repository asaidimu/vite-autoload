export interface WidgetData extends Record<string, unknown> {
  // defined inside a widget file
  title: string;
  description: string;
  name: string;
  position: {
    row: number;
    column: number;
  };
    span? :{
        row?: number,
        column?: number,
    }
}

export interface Widget extends WidgetData {
  // result of being transformed and autoloaded
  path: string;
}
