"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

type RouteError = {
	message: string;
	missingParams: string[];
};

export function useRouteError(): {
	error: RouteError;
	goBack: () => void;
	showReport: boolean;
	toggleReport: () => void;
	reportText: string;
	handleReportChange: (value: string) => void;
	handleSubmitReport: () => void;
} {
	const router = useRouter();
	const pathname = usePathname();
	const [showReport, setShowReport] = useState(false);
	const [reportText, setReportText] = useState("");

	const expectedSegments = ["type", "id", "version", "metals"];
	let missingParams: string[] = [];

	if (pathname) {
		const parts = pathname.split("/").filter(Boolean);

		expectedSegments.forEach((segment, index) => {
			if (!parts[index]) {
				missingParams.push(segment);
			}
		});
	}

	const error: RouteError = {
		message: missingParams.length > 0 ? `Missing parameter(s): ${missingParams.join(", ")}` : "Page not found",
		missingParams,
	};

	const toggleReport = () => setShowReport((prev) => !prev);

	const handleReportChange = (value: string) => {
		setReportText(value);
	};

	const handleSubmitReport = () => {
		if (!reportText.trim()) {
			console.warn("Report is empty");
			return;
		}

		console.log("Report submitted:", reportText);
		setReportText("");
		setShowReport(false);
	};

	return {
		error,
		goBack: () => router.push("/"),

		showReport,
		toggleReport,
		reportText,
		handleReportChange,
		handleSubmitReport,
	};
}

