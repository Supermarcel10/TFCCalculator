import winston, {format} from "winston";


const logger = winston.createLogger(
		{
			level : process.env.LOG_LEVEL || "info",
			format : winston.format.json(),
			exitOnError : false,
			defaultMeta : {service : "TFC-Calculator"}
			// transports : [new winston.transports.Console()]
		}
);

const devFormat = format.combine(
		format.colorize({all : true}),
		format.timestamp({format : "YYYY-MM-DD HH:mm:ss.SSS"}),
		format.errors({stack : true}),
		format.splat(),
		format.printf(({level, message, timestamp, stack}) => {
			return `${timestamp} ${level}: ${stack || message}`;
		})
);

if (process.env.NODE_ENV === "production") {
	logger.add(new winston.transports.Console());
} else {
	logger.add(new winston.transports.Console(
			{
				format : devFormat
			})
	);
}

export default logger;