-- Migration: elimina teams.informes_semanales.
-- Sus datos se copiaron a planes_ia.datos.meta.informe en
-- 20261002100000_move_weekly_report_meta_into_plans.sql. Comprueba esa copia antes de aplicar esta.

drop table if exists teams.informes_semanales;
