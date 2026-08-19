export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-2 px-6 py-6 text-sm text-muted-foreground sm:flex-row">
        <span>&copy; {new Date().getFullYear()} Bike Rental</span>
        <span>Ride safe. Helmets included.</span>
      </div>
    </footer>
  );
}
