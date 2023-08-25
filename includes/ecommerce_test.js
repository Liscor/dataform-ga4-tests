module.exports = (table,date_start,date_end) => {
  const bad_ecc_events= publish("bad_ecc_events").query(ctx => `
    select
      event_timestamp
      ,event_name
      ,(select value.int_value from unnest(event_params) where key = "ga_session_id") as ga_session_id
      ,user_pseudo_id
      --,ecommerce
      --,items
    from
      ${ctx.ref(table)}
    where
      _table_suffix between '${date_start}' and '${date_end}'
      and event_name in ("view_promotion","view_item_list","view_item","select_item","add_to_cart","add_to_wishlist","remove_from_cart","view_cart","begin_checkout","add_payment_info","add_shipping_info","purchase")
      and (
        (
          (array_length(items) = 0)
          or EXISTS(SELECT * FROM UNNEST(items) AS items WHERE items.item_id is null)
          or EXISTS(SELECT * FROM UNNEST(items) AS items WHERE items.item_name is null)
        )
        or (event_name = "purchase" 
          and (
            ecommerce is null
            or ecommerce.transaction_id is null
            or ecommerce.purchase_revenue is null 
            or ecommerce.purchase_revenue <= 0
          )
        )
      )
  `)

  const ecc_events_overview = publish("ecc_events_overview").query(ctx => `
    with bad_ecc_events as(
      select 
        event_name
        ,count(*) bad_ecc_events
      from
        ${ctx.ref("bad_ecc_events")}
      group by 1
    ),
    ecc_events as(
      select
        event_name
        ,count(*) ecc_events
      from
        ${ctx.ref(table)}
      where
        _table_suffix between '${date_start}' and '${date_end}'
        and event_name in ("view_promotion","view_item_list","view_item","select_item","add_to_cart","add_to_wishlist","remove_from_cart","view_cart","begin_checkout","add_payment_info","add_shipping_info","purchase")
      group by 1                                                              
      )
      select
        ee.event_name
        ,coalesce(bee.bad_ecc_events,0) as bad_ecc_events
        ,coalesce(ee.ecc_events,0) as ecc_events  
      from 
        ecc_events as ee
      left join bad_ecc_events as bee
        using(event_name)
    `)
    
    const ecc_events_test = assert("ecc_events_test").query(ctx => `
      select
        event_name
        ,bad_ecc_events
        ,ecc_events
      from
        ${ctx.ref("ecc_events_overview")}
      where 
        bad_ecc_events / ecc_events >= 0.10
    `)

  return { bad_ecc_events,ecc_events_overview, ecc_events_test };
}

