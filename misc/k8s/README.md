# Deploying in Kubernetes

This assumes you have a cluster already set up, and also have Postgres running
somewhere (since running databases in containers is not really the best idea).
If you don't, check out some links:

* Quick cluster setup:
  * [Microk8s](https://microk8s.io/)
  * [Rancher Quickstart](https://github.com/rancher/quickstart) (works with AWS,
    Digital Ocean, and Vagrant)
* Hosted Postgres:
  * [AWS RDS](https://aws.amazon.com/rds/postgresql/)
  * [Azure Database](https://azure.microsoft.com/en-us/services/postgresql/)
  * [Google Cloud SQL](https://cloud.google.com/sql/)
  * [Digital Ocean Managed Databases](https://www.digitalocean.com/products/managed-databases/)
  * [Hosted Postgres List](https://www.postgresql.org/support/professional_hosting/)

Take a look at the variables and comments in the configmap template. Once you've
got those squared away, `npm i && ./index.js`, then check out the `build`
directory.

If you don't want to run Redis in Kubernetes and prefer something external
(ElastiCache, for example) you can remove those files. Once you're satisfied,
`kubectl apply -R -f build`.

## Why is this in JS?

Because editing large amounts of YAML or JSON by hand is not fun.
