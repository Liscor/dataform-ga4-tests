module.exports = (table,date_start,date_end,config) => {
const overview = publish("overview",config).query(ctx => `
  SELECT
    event_name
    ,bad_ecc_events
    ,ecc_events
    ,null as bad_session_number_users
    ,null as bad_first_date_users
    ,null as users
  FROM
    ${ctx.ref("ecc_events_overview")}
  union all
    select 
    "all users" as event_name
    ,null as bad_ecc_events
    ,null as ecc_events
    ,bad_session_number_users
    ,bad_first_date_users
    ,users
  from 
    ${ctx.ref("users_agg")}
  `)
  return overview
}