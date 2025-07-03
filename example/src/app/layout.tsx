import {
    NavigationBarContainer,
    NavigationBarProvider,
} from "@/components/navigation-bar";
import WidgetContainer from "./layout/container";
import ApplicationHeader from "./layout/header";

export default function ApplicationLayout() {
  return (
    <NavigationBarProvider>
      <div className="max-w-screen w-screen h-screen flex flex-col overflow-hidden relative p-2 gap-2">
        <NavigationBarContainer className="w-full p-2 h-16 sticky top-0 bg-background rounded border" />
        <ApplicationHeader />
        <WidgetContainer />
      </div>
    </NavigationBarProvider>
  );
}
