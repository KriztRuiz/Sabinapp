-- SABINAPP 1.0 | M3
-- Hardening del generador de referencias de pago publicitario.
--
-- Hallazgo M3-16I4A:
--
-- public.generate_ad_payment_reference()
-- era SECURITY DEFINER y podía ser ejecutada directamente por:
--
-- - PUBLIC
-- - anon
-- - authenticated
--
-- Además, public.ad_payment_reference_seq tenía privilegios de
-- uso accesibles para roles públicos.
--
-- La función únicamente debe ser utilizada internamente por
-- procesos privilegiados, como approve_ad_request().
--
-- El DEFAULT de:
--
-- public.ad_payments.payment_reference
--
-- continúa siendo:
--
-- public.generate_ad_payment_reference()
--
-- y funciona dentro de las RPC SECURITY DEFINER propiedad de
-- postgres.


-- ============================================================
-- 1. FUNCIÓN GENERADORA
-- ============================================================

REVOKE ALL
ON FUNCTION public.generate_ad_payment_reference()
FROM PUBLIC;

REVOKE ALL
ON FUNCTION public.generate_ad_payment_reference()
FROM anon;

REVOKE ALL
ON FUNCTION public.generate_ad_payment_reference()
FROM authenticated;


-- El service_role conserva capacidad explícita para operaciones
-- administrativas/backend que pudieran requerir la función.

GRANT EXECUTE
ON FUNCTION public.generate_ad_payment_reference()
TO service_role;


-- ============================================================
-- 2. SECUENCIA
-- ============================================================

REVOKE ALL
ON SEQUENCE public.ad_payment_reference_seq
FROM PUBLIC;

REVOKE ALL
ON SEQUENCE public.ad_payment_reference_seq
FROM anon;

REVOKE ALL
ON SEQUENCE public.ad_payment_reference_seq
FROM authenticated;


-- Mantener acceso explícito del backend privilegiado.
--
-- USAGE permite nextval/currval.
-- SELECT permite consultar currval/estado cuando corresponda.

GRANT USAGE, SELECT
ON SEQUENCE public.ad_payment_reference_seq
TO service_role;
