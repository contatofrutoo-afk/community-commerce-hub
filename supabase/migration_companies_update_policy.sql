-- =========================
-- Permite que membros da empresa (user_roles) atualizem os dados da empresa
-- Necessário porque a policy de UPDATE estava faltando — apenas SELECT e INSERT existiam
-- =========================

CREATE POLICY "Company members can update their company" ON public.companies
  FOR UPDATE TO authenticated
  USING (public.has_company_access(auth.uid(), id))
  WITH CHECK (public.has_company_access(auth.uid(), id));
