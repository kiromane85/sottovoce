// Sottovoce home-screen mic widget (Android only).
// Compiled to a native Android widget at build time by react-native-android-widget.
// Tapping the mic opens the app via deep link `sottovoce://record` which the
// app's root layout intercepts to navigate straight to /recording.

import React from "react";
import {
  FlexWidget,
  IconWidget,
  TextWidget,
} from "react-native-android-widget";

export function SottovoceMicWidget() {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      clickActionData={{ url: "sottovoce://record" }}
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: "#E11D48",
        borderRadius: 32,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
      }}
    >
      <IconWidget
        font="material"
        icon="mic"
        size={36}
        style={{ color: "#FFFFFF" }}
      />
      <TextWidget
        text="Sottovoce"
        style={{
          color: "#FFFFFF",
          fontSize: 12,
          fontWeight: "700",
          marginTop: 6,
        }}
      />
    </FlexWidget>
  );
}
