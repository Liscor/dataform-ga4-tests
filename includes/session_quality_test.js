module.exports = (table,date_start,date_end,config) => {
    const sessions = publish("sessions",config).query(ctx => `
        with sessions as(
            select 
                session_id
                ,min(ga_session_id) as ga_session_id
                ,min(ga_session_number) as ga_session_number
                ,array_agg(session_datetime) as session_datetimes
                ,min(user_pseudo_id) as user_pseudo_id
                ,array_agg(event_name) as event_names
                ,array_agg(if(source is not null,struct(event_timestamp as touch_timestamp,source as source,medium as medium,campaign as campaign,page_location),null)ignore nulls) as session_touchpoints

            from 
                (
                    select 
                        datetime(timestamp_micros(event_timestamp)) as session_datetime
                        ,event_timestamp
                        ,concat((select value.int_value from unnest(event_params) where key = "ga_session_id"),"-",user_pseudo_id) as session_id
                        ,(select value.int_value from unnest(event_params) where key = "ga_session_id") as ga_session_id
                        ,(select value.int_value from unnest(event_params) where key = "ga_session_number") as ga_session_number
                        ,user_pseudo_id
                        ,event_name
                        ,(select value.string_value from unnest(event_params) where key ="source") as source
                        ,(select value.string_value from unnest(event_params) where key ="medium") as medium
                        ,(select value.string_value from unnest(event_params) where key ="campaign") as campaign
                        ,(select value.string_value from unnest(event_params) where key ="page_location") as page_location
                    from
                        ${ctx.ref(table)}
                    where 
                        _table_suffix between '${date_start}' and '${date_end}'
                        and (select value.int_value from unnest(event_params) where key = "ga_session_id") is not null
                        and user_pseudo_id is not null
                    order by
                        event_timestamp
                )
        group by 1)

        select 
             session_id
            ,ga_session_id
            ,ga_session_number
            ,session_datetimes
            ,array_reverse(session_datetimes)[offset(0)] - session_datetimes[offset(0)] as session_duration
            ,event_names
            ,session_touchpoints
            ,user_pseudo_id
        from 
            sessions
    `)

    const missing_ids = publish("missing_ids",config).query(ctx => `
        select
            event_timestamp
            ,(select value.int_value from unnest(event_params) where key = "ga_session_id") as ga_session_id
            ,(select value.int_value from unnest(event_params) where key = "ga_session_number") as ga_session_number
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

    return { sessions, missing_ids }
}