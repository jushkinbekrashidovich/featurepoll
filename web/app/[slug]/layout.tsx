// No auth checks — public board layout
export default function PublicBoardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
