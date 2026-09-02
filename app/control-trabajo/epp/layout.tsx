import ProtectedModule from "@/components/ProtectedModule";

export default function EppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedModule modulo="EPP">
      {children}
    </ProtectedModule>
  );
}