import pool from "../db/pool.js";

export function renderError(res, status, message) {
  res.status(status).render("error", { pageTitle: "Error", status, message });
}

// Precondition for every signed-in page: the session's user must still exist.
// Also refreshes the name in case it was changed from another session.
export async function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect("/signin");

  const { rows } = await pool.query("SELECT user_id, name FROM users WHERE user_id = $1", [
    req.session.user.id,
  ]);
  if (rows.length === 0) {
    return req.session.destroy(() => res.redirect("/signin"));
  }

  req.session.user = { id: rows[0].user_id, name: rows[0].name };
  res.locals.currentUser = req.session.user;
  next();
}

// Sign in / sign up pages make no sense once signed in
export function requireGuest(req, res, next) {
  if (req.session.user) return res.redirect("/");
  next();
}
