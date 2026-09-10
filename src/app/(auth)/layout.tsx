import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <Logo className="scale-[1.33] -translate-x-[5%]" textClassName="text-xl" />
          <p className="text-sm text-muted-foreground">Onde suas finanças encontram direção.</p>
        </div>
        {children}
      </div>
    </div>
  );
}
