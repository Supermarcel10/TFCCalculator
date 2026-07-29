const nextJest = require("next/jest.js");

const createJestConfig = nextJest({
	dir: "./",
});

const customJestConfig = {
	testEnvironment: "node",
	setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
	collectCoverage: true,
	coverageReporters: ["json", "lcov", "text", "clover", "html"],
	coverageDirectory: "coverage",
	coverageProvider: "v8",
	restoreMocks: true,
	errorOnDeprecated: true,
	slowTestThreshold: 3,
	bail: 5,
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/src/$1",
		"^@test/(.*)$": "<rootDir>/test/$1",
	},
};

module.exports = createJestConfig(customJestConfig);
