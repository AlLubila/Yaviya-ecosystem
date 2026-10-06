import { randomUUID } from "node:crypto";
import { createDatabase } from "../backend/database.js";
import { normalizeLogin, passwordHash } from "../backend/auth.js";
import { migrate } from "./migrate.mjs";
const login = normalizeLogin(process.env.OWNER_LOGIN),
  password = process.env.OWNER_PASSWORD;
if (!login || !password || password.length < 12 || password.length > 128)
  throw new Error(
    "OWNER_LOGIN et OWNER_PASSWORD (12 à 128 caractères) sont requis dans l’environnement",
  );
const db = await createDatabase();
try {
  await migrate(db);
  if (
    await db
      .prepare("SELECT user_id FROM admin_access WHERE id=?")
      .bind("owner")
      .first()
  )
    throw new Error(
      "Un administrateur existe déjà. Aucun changement effectué.",
    );
  if (
    await db
      .prepare("SELECT id FROM auth_users WHERE login=?")
      .bind(login)
      .first()
  )
    throw new Error(
      "Cet identifiant existe déjà. Utilisez un identifiant administrateur distinct.",
    );
  const id = randomUUID();
  await db.batch([
    db
      .prepare(
        "INSERT INTO auth_users (id,login,password_hash,created_at) VALUES (?,?,?,?)",
      )
      .bind(id, login, await passwordHash(password), Date.now()),
    db
      .prepare("INSERT INTO admin_access (id,user_id) VALUES (?,?)")
      .bind("owner", id),
  ]);
  console.log("Compte administrateur créé. Aucun mot de passe affiché.");
} finally {
  db.close();
}
