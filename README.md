# GA4 General Tests for Dataform (alpha)
This package deploys a set of tests for Google Analytics 4 (GA4) in Dataform within the Google Cloud Platform (GCP).
The tests currently cover different quality aspects:
- Standard GA4 e-commerce events like "purchase" or "item_view"
- Missing ids like ga_session_id or user_pseudo_id
- Sessions quality: sessions which are longer than 8 hours or missing session_start events
## Getting Started
In Dataform packages are installied similar to other nodejs apps.

1. Install the package in the dependencies object inside the package.json 
```
"dataform-ga4-tests": "https://github.com/Liscor/dataform-ga4-tests/archive/refs/tags/ap-training.tar.gz"
```
2. To call the package you need to require the package and call the function. The function takes date_start, date_end defines date range for the source data. In the GA4 object the GA4 source dataset needs to be defined with project,dataset and table. It is advised to use the wildcard operator in connection with the table name exp. "events_*"
If no parameters are provided the Google Analytics 4 dataset from the Google Merchandise Store is being used as an example instead. 
```
const tests = require("dataform-ga4-tests");
tests({
    date_start: "20210101",
    date_end: "20210601",
    ga4:{
        project: "bigquery-public-data",
        dataset: "ga4_obfuscated_sample_ecommerce",
        table: "events_*",
    }
});
```


