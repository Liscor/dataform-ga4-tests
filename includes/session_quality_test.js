module.exports = (table,date_start,date_end,config) => {
    const sessions = publish("sessions",config).query(ctx => `
        with sessions as(
            select 
                session_id
                ,min(ga_session_id) as ga_session_id
                ,min(timestamp_seconds(ga_session_id)) as ga_session_id_date
                ,min(ga_session_number) as ga_session_number
                ,min(user_pseudo_id) as user_pseudo_id
                ,array_agg(struct(event_datetime as event_datetime, event_name as event_name)) as events
                ,array_agg(if(source is not null,struct(event_timestamp as touch_timestamp,source as source,medium as medium,campaign as campaign,page_location),null)ignore nulls) as session_touchpoints

            from 
                (
                    select 
                        timestamp_micros(event_timestamp) as event_datetime
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
            ,ga_session_id_date
            ,ga_session_number
            ,session_duration
            ,events
            ,session_touchpoints
            ,user_pseudo_id
            ,case
                when extract(hour from session_duration) > 4 then "bad"
                when extract(day from session_duration) > 1 then "bad"
                else "good"
            end as session_duration_quality
            ,case
                when format_timestamp("%c",ga_session_id_date) = format_timestamp("%c",events[offset(0)].event_datetime) then "good"
                else "bad"
            end as session_id_date_quality
        from(
            select 
                session_id
                ,ga_session_id
                ,ga_session_id_date
                ,ga_session_number
                ,array_reverse(events)[offset(0)].event_datetime - events[offset(0)].event_datetime as session_duration
                ,events
                ,session_touchpoints
                ,user_pseudo_id
        from 
            sessions
        )
    `)

    const sessions_agg = publish("sessions_agg",config).query(ctx => `
        select
            sum(
                case
                    when session_duration_quality = "bad" then 1
                    else 0
                end
            ) as bad_session_duration
            ,sum(
                case
                    when session_id_date_quality = "bad" then 1
                    else 0
                end 
            ) as bad_session_id
            ,count(*) as sessions
        from
            ${ctx.ref("sessions")}
    
    `)


    return { sessions, sessions_agg}
}