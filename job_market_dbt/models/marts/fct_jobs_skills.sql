with base as (

    select
        job_id,
        source_name,
        area,
        seniority,
        mercado,
        title,
        tags_raw,
        description_raw
    from {{ ref('int_jobs_unified') }}

),

-- Skills explícitas do RemoteOK (já vêm como tags)
remoteok_skills as (

    select
        job_id,
        source_name,
        area,
        seniority,
        mercado,
        trim(lower(value::varchar))     as skill
    from base,
    lateral flatten(input => split(tags_raw, ', '))
    where source_name = 'remoteok'
      and tags_raw is not null
      and trim(lower(value::varchar)) in (
            'power bi', 'sql', 'python', 'dbt', 'snowflake',
            'tableau', 'looker', 'qlik', 'excel', 'figma',
            'bigquery', 'aws', 'azure', 'gcp', 'spark',
            'airflow', 'kafka', 'linguagem r', 'machine learning',
            'data warehouse', 'etl', 'api', 'git', 'docker',
            'postgresql', 'mongodb', 'mysql', 'oracle',
            'n8n', 'javascript', 'html', 'css', 'react',
            'scrum', 'agile', 'kanban', 'jira', 'notion'
      )
),

-- Skills extraídas da descrição via keywords (todas as fontes)
description_skills as (

    select
        job_id,
        source_name,
        area,
        seniority,
        mercado,
        skill
    from base,
    lateral (
        select skill from (values
            ('power bi'), ('sql'), ('python'), ('dbt'), ('snowflake'),
            ('tableau'), ('looker'), ('qlik'), ('excel'), ('figma'),
            ('bigquery'), ('aws'), ('azure'), ('gcp'), ('spark'),
            ('airflow'), ('kafka'), ('linguagem r'), ('machine learning'),
            ('data warehouse'), ('etl'), ('api'), ('git'), ('docker'),
            ('postgresql'), ('mongodb'), ('mysql'), ('oracle'),
            ('n8n'), ('javascript'), ('html'), ('css'), ('react'),
            ('scrum'), ('agile'), ('kanban'), ('jira'), ('notion')
        ) as skills_list(skill)
    ) as skill_lookup
     where (
        -- Skills longas: busca simples por substring
        (len(skill) > 2 and contains(lower(description_raw), skill))
        or
        -- Skills curtas (1-2 chars): exige word boundary com espaços ou pontuação
        (len(skill) <= 2 and regexp_like(lower(description_raw), '(^|[^a-z])' || skill || '([^a-z]|$)'))
    )
    and description_raw is not null

),

-- União deduplicada
all_skills as (

    select job_id, source_name, area, seniority, mercado, skill
    from remoteok_skills

    union

    select job_id, source_name, area, seniority, mercado, skill
    from description_skills

)

select * from all_skills