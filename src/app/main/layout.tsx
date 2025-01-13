import { MainLayout } from "@/components/layout/main-layout";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
} 