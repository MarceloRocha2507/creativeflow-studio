-- Adicionar coluna de data de liberação do pagamento
ALTER TABLE public.payments ADD COLUMN release_date DATE;