import { Router } from "express";
import pool from "../db/pool.js";
import { CATEGORIES, RULES, parseId, validate } from "../lib/validate.js";
import { renderError } from "../lib/auth.js";

const router = Router();

const POST_FIELDS = { title: RULES.title, category: RULES.category, body: RULES.body };

async function renderFeed(req, res, { status = 200, values = {}, error = null } = {}) {
  const category = CATEGORIES.includes(req.query.category) ? req.query.category : "";
  const { rows: posts } = await pool.query(
    `SELECT blog_id, creator_name, creator_user_id, title, body, category, date_created, date_updated
       FROM blogs
      WHERE $1::text = '' OR category = $1
      ORDER BY date_created DESC`,
    [category]
  );

  res.status(status).render("index", {
    pageTitle: "Blog",
    posts,
    categories: CATEGORIES,
    activeCategory: category,
    values,
    error,
  });
}

// Precondition for edit/delete: the post exists and belongs to the signed-in user
async function loadOwnPost(req, res, next) {
  const id = parseId(req.params.id);
  if (id === null) return renderError(res, 404, "That post doesn't exist.");

  const { rows } = await pool.query("SELECT * FROM blogs WHERE blog_id = $1", [id]);
  if (rows.length === 0) return renderError(res, 404, "That post doesn't exist.");
  if (rows[0].creator_user_id !== req.session.user.id) {
    return renderError(res, 403, "You can only edit or delete posts you created.");
  }

  req.post = rows[0];
  next();
}

router.get("/", async (req, res) => {
  // An unknown category is dropped rather than showing an empty feed
  if (req.query.category && !CATEGORIES.includes(req.query.category)) return res.redirect("/");
  await renderFeed(req, res);
});

router.post("/posts", async (req, res) => {
  const { values, error } = validate(req.body, POST_FIELDS);
  if (error) return renderFeed(req, res, { status: 400, values, error });

  const { id, name } = req.session.user;
  const result = await pool.query(
    `INSERT INTO blogs (creator_name, creator_user_id, title, body, category)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING blog_id`,
    [name, id, values.title, values.body, values.category]
  );
  if (result.rowCount !== 1) throw new Error("Blog insert did not add a row");

  res.redirect("/");
});

router.get("/posts/:id/edit", loadOwnPost, (req, res) => {
  res.render("edit", { pageTitle: "Edit post", post: req.post, values: req.post, categories: CATEGORIES, error: null });
});

router.post("/posts/:id/edit", loadOwnPost, async (req, res) => {
  const { values, error } = validate(req.body, POST_FIELDS);
  if (error) {
    return res.status(400).render("edit", { pageTitle: "Edit post", post: req.post, values, categories: CATEGORIES, error });
  }

  // Owner is checked again in the WHERE so the update can't touch someone else's post
  const result = await pool.query(
    `UPDATE blogs
        SET title = $1, body = $2, category = $3, date_updated = NOW()
      WHERE blog_id = $4 AND creator_user_id = $5`,
    [values.title, values.body, values.category, req.post.blog_id, req.session.user.id]
  );
  if (result.rowCount !== 1) return renderError(res, 404, "That post no longer exists.");

  res.redirect("/");
});

router.post("/posts/:id/delete", loadOwnPost, async (req, res) => {
  const result = await pool.query("DELETE FROM blogs WHERE blog_id = $1 AND creator_user_id = $2", [
    req.post.blog_id,
    req.session.user.id,
  ]);
  if (result.rowCount !== 1) return renderError(res, 404, "That post no longer exists.");

  res.redirect("/");
});

export default router;
