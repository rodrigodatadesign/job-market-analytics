with adzuna as (

    select
        job_id,
        source_name,
        title,
        company_name,
        country,
        city,
        region,
        location_display,
        salary_min,
        salary_max,
        contract_time,
        job_created_at,
        description_raw,
        job_url,
        null as tags_raw,
        null as wwr_category,
        extracted_at,
        'local_brasil'      as mercado
    from {{ ref('stg_adzuna') }}

),

remoteok as (

    select
        job_id,
        source_name,
        title,
        company_name,
        country,
        null  as city,
        null  as region,
        location_display,
        salary_min,
        salary_max,
        null  as contract_time,
        job_created_at,
        description_raw,
        job_url,
        tags_raw,
        null  as wwr_category,
        extracted_at,
        'remoto_global'     as mercado
    from {{ ref('stg_remoteok') }}

),

wwr as (

    select
        job_id,
        source_name,
        title,
        company_name,
        country,
        null  as city,
        null  as region,
        location_display,
        salary_min,
        salary_max,
        null  as contract_time,
        job_created_at,
        description_raw,
        job_url,
        null  as tags_raw,
        wwr_category,
        extracted_at,
        'remoto_global'     as mercado
    from {{ ref('stg_wwr') }}

),

unified as (

    select * from adzuna
    union all
    select * from remoteok
    union all
    select * from wwr

),

enriched as (

    select
        *,

        -- Classificação de senioridade via título
        case
            when lower(title) like any ('%junior%', '%jr%', '%júnior%', '% i ') then 'Junior'
            when lower(title) like any ('%pleno%', '%pl%', '% ii ', '%mid%', '%mid-level%') then 'Pleno'
            when lower(title) like any ('%senior%', '%sênior%', '%sr%', '% iii ', '%lead%', '%principal%', '%staff%') then 'Senior'
            when lower(title) like any ('%head%', '%manager%', '%director%', '%gerente%') then 'Gestão'
            else 'Não especificado'
        end as seniority,

        -- Classificação de área via título
        case
            when lower(title) like any ('%power bi%', '%tableau%', '%looker%', '%qlik%', '%business intelligence%', '% bi %', '%analista bi%') then 'BI / Analytics'
            when lower(title) like any ('%data analyst%', '%analista de dados%', '%analista dados%') then 'BI / Analytics'
            when lower(title) like any ('%data engineer%', '%engenheiro de dados%', '%data engineering%', '%analytics engineer%') then 'Engenharia de Dados'
            when lower(title) like any ('%data scientist%', '%cientista de dados%', '%machine learning%', '% ml %') then 'Data Science / ML'
            when lower(title) like any ('%product designer%', '%ux%', '%ui%', '%product design%') then 'Product Design / UX'
            when lower(title) like any ('%data product%', '%produto de dados%') then 'Data Product'
            else 'Outros'
        end as area

    from unified

)

select * from enriched