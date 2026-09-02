import AuthForm from "@/components/auth/AuthForm";

type LoginPageProps = {
  searchParams: Promise<{
    redirect?: string;
  }>;
};

export default async function LoginPage({
  searchParams,
}: LoginPageProps) {
  const params = await searchParams;

  return (
    <AuthForm
      mode="login"
      redirect={params.redirect}
    />
  );
}
