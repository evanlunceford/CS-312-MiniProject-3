# CS-312 Mini Project 3: Blog with PostgreSQL

The Mini Project 1 blog, now backed by PostgreSQL with sign up / sign in. Posts persist
between sessions, and users can only edit or delete their own posts.

- **Backend:** Node.js + Express 5, `pg` for queries, `express-session` for sign in
- **Frontend:** EJS partials, one CSS file per partial in `public/css/`

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in your Postgres password (and port if it isn't 5432).
3. Create the database and tables, either way:
   - `npm run db:setup` creates `BlogDB` if needed, then runs `db/schema.sql` and `db/seed.sql`, **or**
   - in pgAdmin, create a database named `BlogDB` and run those two files in its Query Tool.
4. `npm start` and open http://localhost:3000

Re-running the setup resets the tables to the seed data.

### Seeded accounts

| User ID  | Password     |
| -------- | ------------ |
| `evan`   | `blogger123` |
| `maya`   | `sunrise42`  |
| `jordan` | `notebook7`  |

## Database

**users**: `user_id` (PK, varchar), `password` (bcrypt hash), `name`, `date_joined`

**blogs**: `blog_id` (PK, serial), `creator_name`, `creator_user_id` (FK → users, `ON UPDATE CASCADE`),
`title`, `body`, `category`, `date_created`, `date_updated`

Passwords are hashed with pgcrypto's `crypt(password, gen_salt('bf', 10))` and checked with
`WHERE password = crypt($input, password)`, so the plain password is never stored.

## Routes and the SQL behind them

| Route                      | SQL                                                   | Checks                                                                 |
| -------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------- |
| `POST /signup`             | `SELECT` for taken id, then `INSERT INTO users`       | Valid id/name/password, passwords match, id not taken (409)            |
| `POST /signin`             | `SELECT ... WHERE user_id AND password match`         | Fields present, one matching row, else 401                             |
| `GET /`                    | `SELECT` all blogs, newest first (optional category)  | Signed in, category must be a known one                                |
| `POST /posts`              | `INSERT INTO blogs ... RETURNING`                     | Signed in, valid title/body/category, one row inserted                 |
| `POST /posts/:id/edit`     | `UPDATE blogs ... WHERE blog_id AND creator_user_id`  | Valid id (404), post exists (404), owned by you (403), one row updated |
| `POST /posts/:id/delete`   | `DELETE FROM blogs WHERE blog_id AND creator_user_id` | Same as edit                                                           |
| `POST /account`            | `UPDATE users` + `UPDATE blogs` in a transaction      | Current password correct (401), new id not taken (409)                 |

Every signed-in request also confirms the session's user still exists in `users`.
