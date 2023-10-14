const ecommerce_test = require("./includes/ecommerce_test");
const session_quality_test = require("./includes/session_quality_test");
const user_quality_test = require("./includes/user_quality_test");
const overview = require("./includes/overview");



module.exports = (params) => {

    params = {
      date_start: "20230101",
      date_end: "20230601",
      ga4:{
        project: "bigquery-public-data",
        dataset: "ga4_obfuscated_sample_ecommerce",
        table: "events_*",
      },
      config:{
        schema: "ga4_testing",
      },
      ...params
    };

    operate("create_testing_schema").queries(ctx => 
      `
      if not exists (
          select 1
          from "${params.ga4.project}.${params.ga4.dataset}.schemata"
          where schema_name = '${params.config.schema}'
      )
      then
          create schema "${params.ga4.project}.${params.ga4.dataset}.${params.config.schema}";
      end if;
      `
    );
    
    const ga4_source = declare({
      database: params.ga4.project,
      schema: params.ga4.dataset,
      name: "events_*",
    });

    let result = {
      ga4_source: ga4_source,
      ecommerce_test: ecommerce_test(params.ga4.table,params.date_start,params.date_end,params.config),
      session_quality_test: session_quality_test(params.ga4.table,params.date_start, params.date_end, params.config),
      user_quality_test: user_quality_test(params.ga4.table,params.date_start, params.date_end, params.config),
      overview: overview(params.ga4.table,params.date_start, params.date_end, params.config),
    };

    return result;
}