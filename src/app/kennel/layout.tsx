import "./globals.css";

export default function KennelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="kennel-website">{children}</div>;
}
