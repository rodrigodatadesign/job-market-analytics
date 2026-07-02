# Job Market Analytics — Brazil Tech Jobs (BI / Data / Product Design)

Pipeline de extração de vagas de três fontes (Adzuna, RemoteOK, We Work Remotely)
para análise comparativa de skills, salários e tendências no mercado de
BI/Dados/Product Design — Brasil local vs. remoto global.

## Setup

```bash
# 1. Criar ambiente virtual (recomendado)
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# 2. Instalar dependências
pip install -r requirements.txt

# 3. Configurar credenciais
cp .env.example .env
# edite o .env e cole seu ADZUNA_APP_ID e ADZUNA_APP_KEY
# (gratuito em https://developer.adzuna.com/signup)
```

## Rodando a extração

```bash
# RemoteOK — não precisa de credenciais
python extraction/remoteok_extract.py

# We Work Remotely — não precisa de credenciais
python extraction/wwr_extract.py

# Adzuna — precisa do .env configurado
python extraction/adzuna_extract.py
```

Cada script salva um JSON em `data/raw/<fonte>/` com timestamp no nome do
arquivo, preservando o payload original de cada vaga.

## Fontes

| Fonte | Tipo | Auth | Cobertura |
|---|---|---|---|
| [Adzuna](https://developer.adzuna.com) | REST JSON | app_id + app_key (grátis) | Brasil, mercado local |
| [RemoteOK](https://remoteok.com/api) | REST JSON | Nenhuma | Remoto, global, tech |
| [We Work Remotely](https://weworkremotely.com/remote-job-rss-feed) | RSS/XML | Nenhuma | Remoto, global, curado |

**Atenção a termos de uso:**
- RemoteOK exige menção como fonte e link direto (sem redirect) para a vaga original.
- We Work Remotely: feeds públicos de uso livre conforme a própria documentação.
- Adzuna: tier gratuito com limite de requisições (25/min); URLs de redirect já
  incluem atribuição (`utm_source`).

## Próximos passos (pipeline completo)

1. ✅ Extração (Python) — scripts neste repositório
2. ⬜ Carga em Snowflake (camada `raw`)
3. ⬜ Transformação via dbt (`staging` → `intermediate` → `marts`)
4. ⬜ Consumo em Power BI

## Estrutura do projeto

```
job_market_project/
├── extraction/
│   ├── adzuna_extract.py
│   ├── remoteok_extract.py
│   └── wwr_extract.py
├── data/raw/           # gerado ao rodar os scripts (ignorado pelo git)
├── requirements.txt
├── .env.example
└── .gitignore
```
