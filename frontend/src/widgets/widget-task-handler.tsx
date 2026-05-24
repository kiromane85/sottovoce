// Background task handler invoked by react-native-android-widget when widget
// lifecycle events fire (added / updated / resized / clicked). This runs in a
// headless JS context — no navigation/UI possible here, just render the widget.

import React from "react";
import type { WidgetTaskHandlerProps } from "react-native-android-widget";

import { SottovoceMicWidget } from "@/src/widgets/SottovoceMicWidget";

const widgets = {
  SottovoceMicWidget: SottovoceMicWidget,
} as const;

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const Widget =
    widgets[props.widgetInfo.widgetName as keyof typeof widgets];
  if (!Widget) return;

  switch (props.widgetAction) {
    case "WIDGET_ADDED":
    case "WIDGET_UPDATE":
    case "WIDGET_RESIZED":
      props.renderWidget(<Widget />);
      break;
    default:
      break;
  }
}
