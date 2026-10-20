import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

loadEnvConfig(process.cwd());

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const email = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.INITIAL_ADMIN_PASSWORD;
  const name =
    process.env.INITIAL_ADMIN_NAME?.trim() || "Administrador ConSys";

  if (!url || !key || !email || !password || password.length < 12) {
    throw new Error(
      "Configure URL, SUPABASE_SERVICE_ROLE_KEY, INITIAL_ADMIN_EMAIL e uma INITIAL_ADMIN_PASSWORD com ao menos 12 caracteres em .env.local.",
    );
  }

  const supabase = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });

  const { count, error: rolesError } = await supabase
    .from("platform_roles")
    .select("user_id", { count: "exact", head: true });
  if (rolesError) {
    throw new Error(`Falha ao consultar papéis globais: ${rolesError.message}`);
  }
  if (count !== 0) {
    throw new Error(
      "Já existe um Super Admin. O bootstrap inicial é permitido somente uma vez.",
    );
  }

  const { data, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  });
  if (createError) {
    throw new Error(`Falha ao criar conta Super Admin: ${createError.message}`);
  }
  if (!data.user) {
    throw new Error("Supabase não retornou a conta Super Admin criada.");
  }

  const { error: roleError } = await supabase.rpc(
    "grant_initial_platform_admin",
    { target_user_id: data.user.id },
  );
  if (roleError) {
    const { error: cleanupError } = await supabase.auth.admin.deleteUser(
      data.user.id,
    );
    if (cleanupError) {
      throw new Error(
        `Falha ao atribuir Super Admin: ${roleError.message}. A conta criada não pôde ser removida: ${cleanupError.message}`,
      );
    }
    throw new Error(`Falha ao atribuir Super Admin: ${roleError.message}`);
  }

  console.info(`Super Admin inicial criado para ${email}.`);
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Falha inesperada no bootstrap.",
  );
  process.exitCode = 1;
});
