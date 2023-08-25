const ecommerce_test = require("./includes/ecommerce_test");
const session_quality_test = require("./includes/session_quality_test");


module.exports = (params) => {

    params = {
      table: "events_*",
      date_start: "20230101",
      date_end: "20230601",
      ga4:{
        project: "bigquery-public-data",
        dataset: "ga4_obfuscated_sample_ecommerce",
        table: "events_*"
      },
      ...params
    };
    
    const ga4_source = declare({
      database: params.ga4.project,
      schema: params.ga4.dataset,
      name: "events_*",
    });

    let result = {
      ga4_source: ga4_source,
      ecommerce_test: ecommerce_test(params.table,params.date_start,params.date_end),
      session_quality_test: session_quality_test(params.table,params.date_start, params.date_end),
    };

    return result;
}