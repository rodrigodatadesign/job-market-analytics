with source as (

    select * from {{ source('raw', 'wwr_jobs') }}

),

parsed as (

    select
        md5(raw_data:link::varchar)                          as job_id,
        'wwr'                                                  as source_name,
        raw_data:title::varchar                                as title,
        null::varchar                                          as company_name,
        'REMOTE'                                               as country,
        null::varchar                                          as city,
        null::varchar                                          as region,
        'Remote'::varchar                                      as location_display,
        null::number                                            as salary_min,
        null::number                                            as salary_max,
        null::varchar                                           as contract_time,
        null::varchar                                           as contract_type,
        try_to_timestamp_ntz(raw_data:published::varchar)        as job_created_at,
        raw_data:summary::varchar                                 as description_raw,
        raw_data:link::varchar                                    as job_url,
        raw_data:_category::varchar                                as wwr_category,
        raw_data:_extracted_at::timestamp_ntz                       as extracted_at

    from source

)

select * from parsed