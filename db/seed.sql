-- Starter users. Passwords are hashed on insert, so sign in with the plain text shown here.
--   evan   / blogger123
--   maya   / sunrise42
--   jordan / notebook7
INSERT INTO users (user_id, password, name, date_joined) VALUES
  ('evan',   crypt('blogger123', gen_salt('bf', 10)), 'Evan Lunceford', '2026-09-01 09:00'),
  ('maya',   crypt('sunrise42',  gen_salt('bf', 10)), 'Maya Chen',      '2026-09-03 14:20'),
  ('jordan', crypt('notebook7',  gen_salt('bf', 10)), 'Jordan Ellis',   '2026-09-05 18:45');

INSERT INTO blogs (creator_name, creator_user_id, title, body, category, date_created) VALUES
  ('Evan Lunceford', 'evan', 'Moving My Blog Off of Arrays',
   'The first version of this blog kept every post in a JavaScript array, which meant every restart wiped the slate clean. This version stores everything in PostgreSQL, so posts stick around between sessions. The change was mostly swapping array methods for SELECT, INSERT, UPDATE and DELETE statements.',
   'Tech', '2026-09-08 10:15'),
  ('Maya Chen', 'maya', 'A Morning Routine That Actually Stuck',
   'I have tried a dozen morning routines. The one that lasted is the shortest: water, a ten minute walk, and writing down the one thing that has to get done today. No apps, no streaks, just a notebook by the door.',
   'Lifestyle', '2026-09-12 07:40'),
  ('Jordan Ellis', 'jordan', 'Studying for Exams With Spaced Repetition',
   'Cramming works for about two days. Spaced repetition works for months. I put each lecture''s key ideas on flashcards and review them on a schedule that stretches out as I get them right. It takes ten minutes a day and finals week is a lot calmer.',
   'Education', '2026-09-18 21:05'),
  ('Evan Lunceford', 'evan', 'Why I Like Server-Rendered Pages',
   'Single page apps are great when you need them, but a lot of sites do not. With EJS the server builds the HTML, the browser shows it, and forms just post back. There is less to break and the pages load fast.',
   'Tech', '2026-09-24 16:30'),
  ('Maya Chen', 'maya', 'Cooking One Big Pot on Sundays',
   'Sunday afternoons I make a big pot of chili or curry and portion it out for the week. It saves money, cuts down on takeout, and means a weeknight dinner is five minutes in the microwave.',
   'Lifestyle', '2026-10-01 12:10'),
  ('Jordan Ellis', 'jordan', 'Reading Papers Without Getting Lost',
   'Start with the abstract, then jump to the figures and the conclusion. Only then read the methods. If the figures do not make sense yet, the details will not either, so that is the signal to go back and look up the background.',
   'Education', '2026-10-06 19:55');
