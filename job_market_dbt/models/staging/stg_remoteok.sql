with source as (

    select * from {{ source('raw', 'remoteok_jobs') }}

),

parsed as (

    select
        raw_data:id::varchar                            as job_id,
        'remoteok'                                       as source_name,
        raw_data:position::varchar                       as title,
        raw_data:company::varchar                         as company_name,
        'REMOTE'                                          as country,
        null::varchar                                      as city,
        null::varchar                                      as region,
        'Remote'::varchar                                  as location_display,
        raw_data:salary_min::number                        as salary_min,
        raw_data:salary_max::number                        as salary_max,
        null::varchar                                       as contract_time,
        null::varchar                                       as contract_type,
        try_to_timestamp_ntz(raw_data:date::varchar)        as job_created_at,
        raw_data:description::varchar                       as description_raw,
        raw_data:url::varchar                                as job_url,
        array_to_string(raw_data:tags, ', ')::varchar         as tags_raw,
        raw_data:_extracted_at::timestamp_ntz                 as extracted_at

    from source

)

select * from parsed