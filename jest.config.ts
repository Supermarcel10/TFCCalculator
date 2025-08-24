/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

// --- Polyfill for TextEncoder/TextDecoder needed during config evaluation ---
import { TextEncoder, TextDecoder } from 'util';
// @ts-ignore
(global as any).TextEncoder = TextEncoder;
// @ts-ignore
(global as any).TextDecoder = TextDecoder;
// ---------------------------------------------------------------------------

import type { Config } from 'jest'
import nextJest from 'next/jest'

const createJestConfig = nextJest({
	                                  dir: './',
                                  })

const customJestConfig: Config = {
	setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
	testEnvironment: 'node',
	collectCoverage: true,
	coverageReporters: ["json", "lcov", "text", "clover", "html"],
	coverageDirectory: "coverage",
	coverageProvider: "v8",
	restoreMocks: true,
	errorOnDeprecated: true,
	slowTestThreshold: 3,
	bail: 5,
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1',
		'^@test/(.*)$': '<rootDir>/test/$1',
	},
	transform: {
		'^.+\\.ts?$': 'ts-jest',
	},
}

export default createJestConfig(customJestConfig)

// All imported modules in your tests should be mocked automatically
// automock: false,

// Automatically clear mock calls, instances, contexts and results before every test
// clearMocks: false,

// Reset the module registry before running each individual test
// resetModules: false,
