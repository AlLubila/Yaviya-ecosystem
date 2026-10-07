-- Follow-up generated after running the Supabase security and performance advisors.

create index courier_reviews_buyer_idx on public.courier_reviews(buyer_id);
create index faq_feedback_user_idx on public.faq_feedback(user_id);
create index identity_checks_reviewer_idx on public.identity_checks(reviewed_by);
create index ledger_courier_idx on public.ledger_entries(courier_id);
create index ledger_payment_idx on public.ledger_entries(payment_transaction_id);
create index order_items_product_idx on public.order_items(product_id);
create index order_items_store_idx on public.order_items(store_id);
create index order_messages_sender_idx on public.order_messages(sender_id);
create index order_participants_store_idx on public.order_participants(store_id);
create index payout_accounts_store_idx on public.payout_accounts(store_id);
create index payouts_account_idx on public.payouts(payout_account_id);
create index payouts_store_idx on public.payouts(store_id);
create index product_view_product_idx on public.product_view_events(product_id);
create index products_category_idx on public.products(category_id);
create index products_owner_idx on public.products(owner_id);
create index products_subcategory_category_idx on public.products(subcategory_id, category_id);
create index refunds_order_idx on public.refunds(order_id);
create index refunds_payment_idx on public.refunds(payment_transaction_id);
create index refunds_requester_idx on public.refunds(requested_by);
create index seller_reviews_buyer_idx on public.seller_reviews(buyer_id);
create index seller_reviews_store_idx on public.seller_reviews(store_id);
create index store_members_user_idx on public.store_members(user_id);
create index wishlist_product_idx on public.wishlist_items(product_id);

create policy product_view_service_only on public.product_view_events
for all to service_role using (true) with check (true);

drop policy profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles for select to authenticated
using (id = (select auth.uid()) or private.is_admin());
drop policy profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy roles_self_read on public.user_roles;
create policy roles_self_read on public.user_roles for select to authenticated
using (user_id = (select auth.uid()) or private.is_admin());
drop policy identifiers_self_read on public.account_identifiers;
create policy identifiers_self_read on public.account_identifiers for select to authenticated
using (user_id = (select auth.uid()) or private.is_admin());

drop policy stores_owner_insert on public.stores;
create policy stores_owner_insert on public.stores for insert to authenticated
with check (owner_id = (select auth.uid()) and status = 'pending' and not verified);
drop policy products_store_insert on public.products;
create policy products_store_insert on public.products for insert to authenticated
with check (owner_id = (select auth.uid()) and private.is_store_member(store_id) and status in ('draft', 'pending') and not visible);

drop policy store_members_owner_write on public.store_members;
create policy store_members_owner_insert on public.store_members for insert to authenticated
with check (private.is_store_owner(store_id));
create policy store_members_owner_update on public.store_members for update to authenticated
using (private.is_store_owner(store_id)) with check (private.is_store_owner(store_id));
create policy store_members_owner_delete on public.store_members for delete to authenticated
using (private.is_store_owner(store_id));

drop policy product_images_store_write on public.product_images;
create policy product_images_store_insert on public.product_images for insert to authenticated
with check (exists (select 1 from public.products p where p.id = product_id and private.is_store_member(p.store_id)));
create policy product_images_store_update on public.product_images for update to authenticated
using (exists (select 1 from public.products p where p.id = product_id and private.is_store_member(p.store_id)))
with check (exists (select 1 from public.products p where p.id = product_id and private.is_store_member(p.store_id)));
create policy product_images_store_delete on public.product_images for delete to authenticated
using (exists (select 1 from public.products p where p.id = product_id and private.is_store_member(p.store_id)));

drop policy wishlist_self on public.wishlist_items;
create policy wishlist_self on public.wishlist_items for all to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy participants_self_read on public.order_participants;
create policy participants_self_read on public.order_participants for select to authenticated
using (user_id = (select auth.uid()) or private.is_admin());
drop policy deliveries_courier_update on public.deliveries;
create policy deliveries_courier_update on public.deliveries for update to authenticated
using (courier_id = (select auth.uid()) or private.is_admin())
with check (courier_id = (select auth.uid()) or private.is_admin());
drop policy messages_participant_insert on public.order_messages;
create policy messages_participant_insert on public.order_messages for insert to authenticated
with check (sender_id = (select auth.uid()) and private.can_access_order(order_id));

drop policy seller_reviews_buyer_insert on public.seller_reviews;
create policy seller_reviews_buyer_insert on public.seller_reviews for insert to authenticated
with check (buyer_id = (select auth.uid()) and exists (
  select 1 from public.orders o
  where o.id = order_id and o.buyer_id = (select auth.uid())
    and o.status in ('delivered', 'received')
));
drop policy courier_reviews_buyer_insert on public.courier_reviews;
create policy courier_reviews_buyer_insert on public.courier_reviews for insert to authenticated
with check (buyer_id = (select auth.uid()));

drop policy identity_self_read on public.identity_checks;
create policy identity_self_read on public.identity_checks for select to authenticated
using (user_id = (select auth.uid()) or private.is_admin());
drop policy identity_self_submit on public.identity_checks;
create policy identity_self_submit on public.identity_checks for insert to authenticated
with check (user_id = (select auth.uid()));
drop policy identity_self_replace_pending on public.identity_checks;
create policy identity_self_replace_pending on public.identity_checks for update to authenticated
using (user_id = (select auth.uid()) and status in ('pending', 'rejected'))
with check (user_id = (select auth.uid()) and status = 'pending');

drop policy payments_buyer_read on public.payment_transactions;
create policy payments_buyer_read on public.payment_transactions for select to authenticated
using (private.is_admin() or exists (
  select 1 from public.orders o where o.id = order_id and o.buyer_id = (select auth.uid())
));
drop policy refunds_requester_read on public.refunds;
create policy refunds_requester_read on public.refunds for select to authenticated
using (requested_by = (select auth.uid()) or private.can_access_order(order_id));
drop policy ledger_store_read on public.ledger_entries;
create policy ledger_store_read on public.ledger_entries for select to authenticated
using (private.is_admin() or (store_id is not null and private.is_store_member(store_id)) or courier_id = (select auth.uid()));
drop policy payout_accounts_self_read on public.payout_accounts;
create policy payout_accounts_self_read on public.payout_accounts for select to authenticated
using (user_id = (select auth.uid()) or private.is_admin());
drop policy payouts_beneficiary_read on public.payouts;
create policy payouts_beneficiary_read on public.payouts for select to authenticated
using (beneficiary_id = (select auth.uid()) or private.is_admin());
drop policy coupons_self_read on public.coupon_events;
create policy coupons_self_read on public.coupon_events for select to authenticated
using (user_id = (select auth.uid()) or private.is_admin());
drop policy faq_feedback_own_read on public.faq_feedback;
create policy faq_feedback_own_read on public.faq_feedback for select to authenticated
using (user_id = (select auth.uid()) or private.is_admin());
drop policy faq_feedback_submit on public.faq_feedback;
create policy faq_feedback_submit on public.faq_feedback for insert to anon, authenticated
with check (user_id is null or user_id = (select auth.uid()));
