module.exports = (table,date_start,date_end,config) => {
    
    const users = publish("users",config).query(ctx => `
        with user_sessions as (
            select
                user_pseudo_id
                ,array_agg(struct(session_datetimes[offset(0)] as session_datetime,ga_session_number as ga_session_number)) as session_numbers
            from
                ${ctx.ref("sessions")}
            group by 1
        ),

        users as (
            select distinct
                user_pseudo_id
                ,date(timestamp_micros(user_first_touch_timestamp)) as user_first_touch_date
            from
                ${ctx.ref(table)}
            where
                _table_suffix between '${date_start}' and '${date_end}'
        )
        
        select
            user_pseudo_id
            ,user_first_touch_date
            ,session_numbers
            ,case
                when array_reverse(session_numbers)[offset(0)].ga_session_number - session_numbers[offset(0)].ga_session_number + 1 = array_length(session_numbers) then "good"
                else "bad"
            end as user_session_number_quality
            ,case
                when if(session_numbers[offset(0)].ga_session_number = 1,user_first_touch_date != date(session_numbers[offset(0)].session_datetime), false) then "bad"
                else "good"
            end as user_first_date_quality
        from
            users
        left join user_sessions
            using(user_pseudo_id)
    `);
    
    const users_agg = publish("users_agg",config).query(ctx =>`
        select
            sum(
                case
                    when user_session_number_quality = "bad" then 1
                    else 0
                end
            ) as bad_session_number_users
            ,sum(
                case
                    when user_first_date_quality = "bad" then 1
                    else 0
                end
            ) as bad_first_date_users
            ,count(*) as users
        from
            ${ctx.ref("users")}
    `)

    const user_quality_test = assert("user_quality_test",config).query(ctx => `
        select
            (bad_session_number_users / users) as bad_session_number_rate
            ,(bad_first_date_users / users) as bad_first_date_rate
        from
            ${ctx.ref("users_agg")}
        where
            bad_session_number_users / users >= 0.2
            or bad_first_date_quality / users >= 0.2

    `)

    return {users,user_quality_test,users_agg}
}