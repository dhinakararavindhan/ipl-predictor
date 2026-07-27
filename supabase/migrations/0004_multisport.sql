-- ═══════════════════════════════════════════════════════════════════════════
-- The Stands — multi-sport matches
-- Run AFTER 0003_features.sql in the Supabase SQL editor.
--
-- The matches table becomes sport-agnostic: any match of any sport gets a
-- hub with Chants, Roars, and Calls. Cricket (IPL) rows keep their app-side
-- team data; other sports carry display info (names, colors) in the row.
-- winner_id lets the leaderboard grade Calls for every sport from the DB.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.matches
  add column sport text not null default 'cricket',
  add column league text not null default 'IPL 2026',
  add column team1_name text,
  add column team2_name text,
  add column team1_short text,
  add column team2_short text,
  add column team1_color text,
  add column team2_color text,
  add column venue text,
  add column winner_id text;

create index matches_sport_idx on public.matches (sport, starts_at desc);

-- ── Backfill cricket winners from the app's fixture data ────────────────────
-- (re-run scripts/generate-matches-sql.ts for the full refreshed seed)
update public.matches m set winner_id = w.winner_id
from (values
  ('m1','rcb'),('m2','mi'),('m3','rr'),('m4','pbks'),('m5','dc'),('m6','srh'),
  ('m7','pbks'),('m8','dc'),('m9','rr'),('m10','lsg'),('m11','rcb'),
  ('m13','rr'),('m14','gt'),('m15','lsg'),('m16','rr'),('m17','pbks'),
  ('m18','csk'),('m19','gt'),('m20','rcb'),('m21','srh'),('m22','csk'),
  ('m23','rcb'),('m24','pbks'),('m25','gt'),('m26','dc'),('m27','srh'),
  ('m28','kkr'),('m29','pbks'),('m30','mi'),('m31','srh'),('m32','rr'),
  ('m33','csk'),('m34','rcb'),('m35','pbks'),('m36','srh'),('m37','gt'),
  ('m38','kkr'),('m39','rcb'),('m40','rr'),('m41','srh'),('m42','gt'),
  ('m43','dc'),('m44','csk'),('m45','kkr'),('m46','gt'),('m47','mi'),
  ('m48','csk'),('m49','srh'),('m50','lsg'),('m51','kkr'),('m52','gt'),
  ('m53','csk'),('m54','rcb')
) as w(id, winner_id)
where m.id = w.id;

-- ── Sample matches from other sports ────────────────────────────────────────
-- Shows the multi-sport model working out of the box; replace or extend with
-- real fixtures any time — every row automatically gets a hub at /match/<id>.
insert into public.matches
  (id, sport, league, team1_id, team2_id, team1_name, team2_name,
   team1_short, team2_short, team1_color, team2_color, venue,
   starts_at, is_completed, winner_id) values
  ('fb1','football','Premier League','ars','liv','Arsenal','Liverpool','ARS','LIV','#EF0107','#C8102E','Emirates Stadium','2026-08-15T16:30:00Z',false,null),
  ('fb2','football','Premier League','mci','che','Manchester City','Chelsea','MCI','CHE','#6CABDD','#034694','Etihad Stadium','2026-08-16T15:00:00Z',false,null),
  ('fb3','football','Premier League','mun','tot','Manchester United','Tottenham Hotspur','MUN','TOT','#DA291C','#132257','Old Trafford','2026-08-17T19:00:00Z',false,null),
  ('fb4','football','Premier League','new','avl','Newcastle United','Aston Villa','NEW','AVL','#241F20','#95BFE5','St James'' Park','2026-08-22T14:00:00Z',false,null),
  ('fb5','football','La Liga','rma','bar','Real Madrid','FC Barcelona','RMA','BAR','#FEBE10','#A50044','Santiago Bernabéu','2026-08-23T19:00:00Z',false,null),
  ('bb1','basketball','NBA Finals','bos','okc','Boston Celtics','Oklahoma City Thunder','BOS','OKC','#007A33','#007AC1','TD Garden','2026-06-10T00:30:00Z',true,'okc'),
  ('bb2','basketball','NBA Finals','okc','bos','Oklahoma City Thunder','Boston Celtics','OKC','BOS','#007AC1','#007A33','Paycom Center','2026-06-13T00:30:00Z',true,'bos'),
  ('bb3','basketball','NBA Preseason','lal','gsw','Los Angeles Lakers','Golden State Warriors','LAL','GSW','#552583','#1D428A','Crypto.com Arena','2026-10-05T02:00:00Z',false,null),
  ('kb1','kabaddi','Pro Kabaddi League','pat','jai','Patna Pirates','Jaipur Pink Panthers','PAT','JAI','#0F9D58','#EC407A','Patliputra Sports Complex','2026-08-30T14:30:00Z',false,null)
on conflict (id) do nothing;
