module.exports = (table,date_start,date_end) => {
  const add_to_cart = publish("test_add_to_cart").query(ctx => `
    select 
      event_timestamp,
      (select value.int_value from unnest(event_params) where key = "ga_session_number") as ga_session_number,
      user_pseudo_id,
    from
      ${ctx.ref(table)}
    where 
      _table_suffix between '${date_start}' and '${date_end}'
      and event_name in ("add_to_cart","add_to_wishlist","remove_from_cart")
      and (
        (ecommerce.total_item_quantity <= 0 or ecommerce.total_item_quantity is null)
        or (ecommerce.unique_items <= 0 or ecommerce.unique_items is null)
        or (array_length(items) = 0)
      )
  `)

  const checkout = publish("test_checkout").query(ctx => `
    select 
      event_timestamp,
      (select value.int_value from unnest(event_params) where key = "ga_session_number") as ga_session_number,
      user_pseudo_id,
    from
      ${ctx.ref(table)}
    where
      _table_suffix between '${date_start}' and '${date_end}'
      and event_name in ("begin_checkout","add_payment_info")
      and (
        (ecommerce.total_item_quantity <= 0 or ecommerce.total_item_quantity is null)
        or (ecommerce.unique_items <= 0 or ecommerce.unique_items is null)
        or (array_length(items) = 0)
     )
  `)

  const purchase = publish("test_purchase").query(ctx => `
    select 
      event_timestamp,
      (select value.int_value from unnest(event_params) where key = "ga_session_number") as ga_session_number,
      user_pseudo_id,
    from 
      ${ctx.ref(table)}
    where
      _table_suffix between '${date_start}' and '${date_end}'
      and event_name = "purchase"
      and (
        (ecommerce.total_item_quantity <= 0 or ecommerce.total_item_quantity is null)
        or (ecommerce.purchase_revenue <= 0 or ecommerce.purchase_revenue is null)
        or (ecommerce.unique_items <= 0 or ecommerce.unique_items is null)
        or (ecommerce.transaction_id is null)
        or (array_length(items) = 0)
      )
  `)

  return { add_to_cart,checkout,purchase };
}

