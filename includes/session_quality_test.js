module.exports = (table,date_start,date_end) => {
    const sleeper_sessions = publish("sleeper_sessions").query(ctx => `
        with sleeper_sessions as(
            select 
                session_id,
                array_agg(event_name) as event_names
            from 
                (
                    select 
                         concat((select value.int_value from unnest(event_params) where key = "ga_session_id"),"-",user_pseudo_id) as session_id
                        ,event_name
                    from
                        ${ctx.ref(table)}
                    where 
                        _table_suffix between '${date_start}' and '${date_end}'
                )
        group by 1)

        select 
             session_id
            ,event_names
        from 
            sleeper_sessions
        where
            array_length(event_names) <= 1
    `)

    const missing_ids = publish("missing_ids").query(ctx => `
        select
            event_timestamp
            ,(select value.int_value from unnest(event_params) where key = "ga_session_id") as ga_session_id
            ,user_pseudo_id
        from 
            ${ctx.ref(table)}
        where
            _table_suffix between '${date_start}' and '${date_end}'
            and (
                (select value.int_value from unnest(event_params) where key = "ga_session_id") is null
                or user_pseudo_id is null
            )
    `)

    const marketing_parameters = publish("marketing_parameters").query(ctx => `
        with marketing_parameters as( 
            SELECT 
                MIN(DATE(timestamp_micros(event_timestamp))) as session_date
                ,session_id
                ,array_agg(if(source is not null,struct(event_timestamp as touch_timestamp,source as source,medium as medium,campaign as campaign),null)ignore nulls) as session_touchpoints,
            from(
                select
                    event_timestamp
                    ,concat(user_pseudo_id,(select value.int_value from unnest(event_params)where key ="ga_session_id")) as session_id
                    ,(select value.string_value from unnest(event_params) where key ="source") as source
                    ,(select value.string_value from unnest(event_params) where key ="medium") as medium
                    ,(select value.string_value from unnest(event_params) where key ="campaign") as campaign
                FROM
                    ${ctx.ref(table)}
                where
                    _table_suffix between '${date_start}' and '${date_end}' 
                    and (select value.int_value from unnest(event_params)where key ="ga_session_id") is not null
                    and event_name not in ('session_start', 'first_visit')
                )  
            group by 2)
        select 
            session_date
            ,session_id
            ,session_touchpoints
        from
            marketing_parameters


    `)

    return { sleeper_sessions, missing_ids,marketing_parameters }
}