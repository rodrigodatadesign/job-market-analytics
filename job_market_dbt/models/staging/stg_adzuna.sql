with source as (

    select * from {{ source('raw', 'adzuna_jobs') }}

),

parsed as (

    select
        raw_data:id::varchar                           as job_id,
        'adzuna'                                        as source_name,
        raw_data:title::varchar                         as title,
        raw_data:company:display_name::varchar          as company_name,
        'BR'                                             as country,
        raw_data:location:area[3]::varchar              as city,
        raw_data:location:area[2]::varchar              as region,
        raw_data:location:display_name::varchar         as location_display,
        raw_data:salary_min::number                     as salary_min,
        raw_data:salary_max::number                     as salary_max,
        raw_data:contract_time::varchar                 as contract_time,
        raw_data:contract_type::varchar                 as contract_type,
        raw_data:created::timestamp_ntz                 as job_created_at,
        raw_data:description::varchar                   as description_raw,
        raw_data:redirect_url::varchar                  as job_url,
        raw_data:_search_term::varchar                  as search_term,
        raw_data:_extracted_at::timestamp_ntz            as extracted_at

    from source

)

select * from parsed