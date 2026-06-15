-- Advisor fixes for retake transactional RPCs.

revoke all on function public.publish_generated_test(
  uuid, uuid, text, text, text, text, text, int, int, uuid, timestamptz, uuid[], jsonb
) from public;
revoke all on function public.publish_generated_test(
  uuid, uuid, text, text, text, text, text, int, int, uuid, timestamptz, uuid[], jsonb
) from anon;
revoke all on function public.publish_generated_test(
  uuid, uuid, text, text, text, text, text, int, int, uuid, timestamptz, uuid[], jsonb
) from authenticated;

revoke all on function public.complete_test_attempt(
  uuid, uuid, uuid, uuid, int, boolean, timestamptz, jsonb
) from public;
revoke all on function public.complete_test_attempt(
  uuid, uuid, uuid, uuid, int, boolean, timestamptz, jsonb
) from anon;
revoke all on function public.complete_test_attempt(
  uuid, uuid, uuid, uuid, int, boolean, timestamptz, jsonb
) from authenticated;

grant execute on function public.publish_generated_test(
  uuid, uuid, text, text, text, text, text, int, int, uuid, timestamptz, uuid[], jsonb
) to service_role;
grant execute on function public.complete_test_attempt(
  uuid, uuid, uuid, uuid, int, boolean, timestamptz, jsonb
) to service_role;
