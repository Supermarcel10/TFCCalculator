import {OTLPHttpJsonTraceExporter, registerOTel} from "@vercel/otel";
import {diag, DiagConsoleLogger, DiagLogLevel} from "@opentelemetry/api";


diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);

registerOTel(
		{
			serviceName : process.env.SERVICE_NAME,
			traceExporter : new OTLPHttpJsonTraceExporter(
					{
						url : process.env.OTEL_COLLECTOR_URL + "/v1/traces",
						headers : {
							"Authorization" : "Basic " + process.env.SIGNOZ_ACCESS_TOKEN
						}
					}
			)
		}
);
