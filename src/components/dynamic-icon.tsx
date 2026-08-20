import * as Icons from "lucide-react";
import type { LucideProps } from "lucide-react";

function toPascalCase(kebab: string): string {
  return kebab
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

export function DynamicIcon({ name, ...props }: { name: string } & LucideProps) {
  const componentName = toPascalCase(name);
  const IconComponent = (Icons as unknown as Record<string, Icons.LucideIcon>)[componentName] ?? Icons.Shapes;
  return <IconComponent {...props} />;
}
