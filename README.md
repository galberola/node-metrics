# Node Metrics

Non-intrusive module to gather metrics from Node.js applications.

## Quick overview

This module will hook into an application and will gather metrics that will be saved into a writable Stream.

This metrics can be used for `monitoring` applications, and for `performance` & `degradation` analysis.

It will register an interval that will run the metrics modules each tick and save the result into the stream.

> It does not have the ability to trigger events based on metric values. The idea of this module is just to gather the metrics and write them into the stream. Although other process (or a filter) can be reading the result stream and perform other tasks.

## Metrics modules

The `node-metrics` module has a group of metrics modules. Each one of them is in charge of gathering metrics for a certain aspect of the Node application.

Each time we run a tick, all available modules are executed.

> I mentioned "all available modules" since you can disable by config modules

The description for each module can be found in their respective doc file:
* [Event Queue](./docs/metrics_event_queue.md)
* [Operative System](./docs/metrics_os.md)
* [Process](./docs/metrics_process.md)
* [Request](./docs/metrics_request.md)

## Data analysis

I used for my local cases `elasticsearch` + `kibana`.
Under `src/streams` there are some stream helpers. They can be used to write to Elasticsearch the metrics instead of the default (File).

For production environments i recommend something similar, using the [`ELK` Stack](http://www.elasticsearch.org/webinars/introduction-elk-stack/)

> If you don't have a spare server to install ELK, you can stick with the default mode (write to file) and add logrotate to prevent consuming all available disk space.


