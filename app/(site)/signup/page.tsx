import AuthForm from "@/components/auth/AuthForm";

type SignupPageProps = {
  searchParams: Promise<{
    redirect?: string;
  }>;
};

export default async function SignupPage({
  searchParams,
}: SignupPageProps) {
  const params = await searchParams;

  return (
    <AuthForm
      mode="signup"
      redirect={params.redirect}
    />
  );
}
