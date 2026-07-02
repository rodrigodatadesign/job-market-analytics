with base as (

    select * from {{ ref('int_jobs_unified') }}

)

select
    job_id,
    source_name,
    mercado,
    title,
    company_name,
    country,
    city,
    region,
    location_display,
    area,
    seniority,
    contract_time,
    salary_min,
    salary_max,
    -- Salário médio quando min e max estão disponíveis
    case
        when salary_min is not null and salary_max is not null
        then (salary_min + salary_max) / 2
        when salary_min is not null then salary_min
        when salary_max is not null then salary_max
        else null
    end                                     as salary_avg,
    -- Flag se tem salário informado
    case
        when salary_min is not null or salary_max is not null
        then true else false
    end                                     as has_salary,
    job_created_at,
    date_trunc('month', job_created_at)     as job_month,
    date_trunc('week', job_created_at)      as job_week,
    description_raw,
    job_url,
    tags_raw,
    wwr_category,
    extracted_at

from base