import { getCurrentUser } from "@/server/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ProfileForm } from "@/components/settings/profile-form";
import { PasswordForm } from "@/components/settings/password-form";
import { PinForm } from "@/components/settings/pin-form";
import { AppearanceSection } from "@/components/settings/appearance-section";
import { BackupSection } from "@/components/settings/backup-section";
import { DangerZoneSection } from "@/components/settings/danger-zone-section";

export default async function ConfiguracoesPage() {
  const user = await getCurrentUser();
  const dbUser = user?.id ? await prisma.user.findUnique({ where: { id: user.id } }) : null;
  const hasPassword = Boolean(dbUser?.passwordHash);
  const hasPin = Boolean(dbUser?.pinHash);
  const isBusiness = dbUser?.profileType === "BUSINESS";

  return (
    <div className="max-w-2xl space-y-4">
      <PageHeader title="Configurações" description="Perfil, segurança e preferências da conta." />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Perfil</CardTitle>
          <CardDescription>{isBusiness ? "Informações da empresa." : "Suas informações pessoais."}</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm name={user?.name ?? null} email={user?.email ?? null} isBusiness={isBusiness} />
        </CardContent>
      </Card>

      {hasPassword && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Senha</CardTitle>
            <CardDescription>Altere sua senha de acesso.</CardDescription>
          </CardHeader>
          <CardContent>
            <PasswordForm />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">PIN de segurança</CardTitle>
          <CardDescription>Camada extra de proteção para dados sensíveis.</CardDescription>
        </CardHeader>
        <CardContent>
          <PinForm hasPin={hasPin} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aparência</CardTitle>
          <CardDescription>Escolha entre modo claro, escuro ou automático.</CardDescription>
        </CardHeader>
        <CardContent>
          <AppearanceSection />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Backup</CardTitle>
          <CardDescription>Exporte uma cópia completa dos seus dados.</CardDescription>
        </CardHeader>
        <CardContent>
          <BackupSection />
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Zona de risco</CardTitle>
          <CardDescription>Ações permanentes — não podem ser desfeitas.</CardDescription>
        </CardHeader>
        <CardContent>
          <DangerZoneSection hasPassword={hasPassword} />
        </CardContent>
      </Card>
    </div>
  );
}
