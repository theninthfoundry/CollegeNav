import * as React from "react";
import { TopBar } from "@/components/layout/top-bar";
import { BottomTabs } from "@/components/layout/bottom-tabs";
import { ToastProvider } from "@/components/ui/toast";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col bg-paper text-ink pb-16 md:pb-0">
        <TopBar />
        <div className="flex-1 flex flex-col">{children}</div>
        <BottomTabs />
      </div>
    </ToastProvider>
  );
}
