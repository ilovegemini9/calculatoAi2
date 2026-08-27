-- Performance indexes for foreign-key lookups and session expiry cleanup.
create index if not exists articles_category_id_idx on public.articles (category_id);
create index if not exists calculator_relations_to_id_idx on public.calculator_relations (to_id);
create index if not exists favorite_calculators_calculator_id_idx on public.favorite_calculators (calculator_id);
create index if not exists recent_calculators_calculator_id_idx on public.recent_calculators (calculator_id);
create index if not exists sessions_expires_at_idx on public.sessions (expires_at);
