/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type {Config} from "jest";
import nextJest from "next/jest.js";


const createJestConfig = nextJest({
	dir: "./",
});

const customJestConfig: Config = {
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

export default createJestConfig(customJestConfig);

// All imported modules in your tests should be mocked automatically
// automock: false,

// Automatically clear mock calls, instances, contexts and results before every test
// clearMocks: false,

// Reset the module registry before running each individual test
// resetModules: false,

