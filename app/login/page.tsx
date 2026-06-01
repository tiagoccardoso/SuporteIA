import { loginAction } from "@/app/actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#dbeafe,transparent_36%),#f8fafc] p-6">
    <form action={loginAction} className="card w-full max-w-md p-8">
      <div className="mb-6"><h1 className="text-3xl font-black">SupportAI Hub</h1><p className="text-slate-600">Acesse a central interna de suporte com IA.</p></div>
      {params.error && <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">Credenciais inválidas ou dados incompletos.</div>}
      <label className="text-sm font-bold">E-mail<input className="input mt-1" name="email" type="email" autoComplete="email" required /></label>
      <label className="mt-3 block text-sm font-bold">Senha<input className="input mt-1" name="password" type="password" autoComplete="current-password" required /></label>
      <button className="btn btn-primary mt-5 w-full">Entrar</button>
      <p className="mt-4 text-xs text-slate-500">Crie o usuário inicial com <code>npm run db:seed</code>.</p>
    </form>
  </main>;
}
