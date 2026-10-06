-- Keep the source order of questions (a table has no inherent row order).
alter table public.questions add column sort_order integer;

update public.questions as q set sort_order = v.ord
from (values
  ('rag-opt-001', 0),
  ('rag-opt-002', 1),
  ('llm-inf-001', 2),
  ('llm-inf-002', 3),
  ('agent-001', 4),
  ('agent-002', 5),
  ('ft-ctx-001', 6),
  ('ft-ctx-002', 7),
  ('mm-rag-001', 8),
  ('mm-rag-002', 9),
  ('hld-001', 10),
  ('hld-002', 11),
  ('hld-003', 12),
  ('hld-004', 13),
  ('hld-005', 14),
  ('hld-006', 15),
  ('hld-007', 16),
  ('hld-008', 17),
  ('hld-009', 18),
  ('hld-010', 19),
  ('hld-011', 20),
  ('hld-012', 21)
) as v(id, ord)
where q.id = v.id;

alter table public.questions alter column sort_order set not null;
