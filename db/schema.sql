
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS blogs;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  user_id     VARCHAR(255) PRIMARY KEY,
  password    VARCHAR(255) NOT NULL,
  name        VARCHAR(255) NOT NULL,
  date_joined TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE blogs (
  blog_id         SERIAL PRIMARY KEY,
  creator_name    VARCHAR(255) NOT NULL,
  creator_user_id VARCHAR(255) NOT NULL
    REFERENCES users (user_id) ON UPDATE CASCADE ON DELETE CASCADE,
  title           VARCHAR(255) NOT NULL,
  body            TEXT         NOT NULL,
  category        VARCHAR(50)  NOT NULL,
  date_created    TIMESTAMP    NOT NULL DEFAULT NOW(),
  date_updated    TIMESTAMP
);

CREATE INDEX blogs_date_created_idx ON blogs (date_created DESC);
