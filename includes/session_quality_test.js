module.exports = (table,date_start,date_end) => {
    const sleeper_session = publish("sleeper_session_test").query(ctx => `
        with sleeper_sessions as(
            select 
                session_id,
                array_agg(event_name) as distinct_event_names
            from 
                (
                    select distinct
                         concat(date(timestamp_micros(event_timestamp)),"-",(select value.int_value from unnest(event_params) where key = "ga_session_id"),"-",user_pseudo_id) as session_id
                        ,event_name
                    from
                        ${ctx.ref(table)}
                    where 
                        _table_suffix between '${date_start}' and '${date_end}'
                )
        group by 1)

        select 
             session_id
            ,distinct_event_names
            ,count(*) over() as bad_sessions
        from 
            sleeper_sessions
        where
            array_length(distinct_event_names) <= 1
            
            


    `)
    return sleeper_session
}