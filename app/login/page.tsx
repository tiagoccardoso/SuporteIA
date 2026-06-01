import Link from "next/link";
import { loginAction, signupAction } from "@/app/actions";

const errorMessages: Record<string, string> = {
  invalid: "Informe um e-mail válido e uma senha com pelo menos 8 caracteres.",
  credentials: "Credenciais inválidas. Confira seu e-mail e senha.",
  "signup-invalid": "Preencha nome, e-mail e senhas iguais com pelo menos 8 caracteres.",
  "email-exists": "Já existe um usuário cadastrado com este e-mail. Faça login para continuar."
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; mode?: string }> }) {
  const params = await searchParams;
  const isSignup = params.mode === "signup";
  const errorMessage = params.error ? errorMessages[params.error] || "Não foi possível concluir a operação. Confira os dados informados." : null;

  return <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#dbeafe,transparent_36%),#f8fafc] p-6">
    <div className="card w-full max-w-md p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-black">SupportAI Hub</h1>
        <p className="text-slate-600">Acesse a central interna de suporte com IA.</p>
      </div>

      <div className="mb-6 grid grid-cols-2 rounded-2xl bg-slate-100 p-1 text-sm font-bold text-slate-600">
        <Link className={`rounded-xl px-4 py-2 text-center transition ${!isSignup ? "bg-white text-blue-700 shadow-sm" : "hover:text-slate-900"}`} href="/login">Entrar</Link>
        <Link className={`rounded-xl px-4 py-2 text-center transition ${isSignup ? "bg-white text-blue-700 shadow-sm" : "hover:text-slate-900"}`} href="/login?mode=signup">Criar usuário</Link>
      </div>

      {errorMessage && <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{errorMessage}</div>}

      {isSignup ? <form action={signupAction}>
        <label className="text-sm font-bold">Nome
          <input className="input mt-1" name="name" type="text" autoComplete="name" required minLength={2} />
        </label>
        <label className="mt-3 block text-sm font-bold">E-mail
          <input className="input mt-1" name="email" type="email" autoComplete="email" required />
        </label>
        <label className="mt-3 block text-sm font-bold">Senha
          <input className="input mt-1" name="password" type="password" autoComplete="new-password" required minLength={8} />
        </label>
        <label className="mt-3 block text-sm font-bold">Confirmar senha
          <input className="input mt-1" name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} />
        </label>
        <button className="btn btn-primary mt-5 w-full">Criar usuário</button>
        <p className="mt-4 text-xs text-slate-500">Novos usuários são criados com perfil de visualização. Um administrador pode ajustar permissões depois.</p>
      </form> : <form action={loginAction}>
        <label className="text-sm font-bold">E-mail
          <input className="input mt-1" name="email" type="email" autoComplete="email" required />
        </label>
        <label className="mt-3 block text-sm font-bold">Senha
          <input className="input mt-1" name="password" type="password" autoComplete="current-password" required />
        </label>
        <button className="btn btn-primary mt-5 w-full">Entrar</button>
        <p className="mt-4 text-xs text-slate-500">Ainda não tem acesso? Use a opção <strong>Criar usuário</strong> acima.</p>
      </form>}
    </div>
  </main>;
}
