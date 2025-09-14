import "@/styles/globals.css";
import type {Metadata} from "next";
import React from "react";


export const metadata : Metadata = {
	title : "TerraFirmaCraft Metal Calculator",
	description : "A simple website to calculate minerals required for metal compositions!",
	openGraph : {
		title : "TerraFirmaCraft Metal Calculator",
		description : "A simple website to calculate minerals required for metal compositions!",
		url : "https://tfc-calculator.devmarcel.net/",
		siteName : "TerraFirmaCraft Metal Calculator",
		images : [
			{
				url : "/api/og",
				width : 1200,
				height : 630,
				alt : "TFC Metal Calculator Cover"
			}
		],
		locale : "en_US",
		type : "website"
	},
	twitter : {
		card : "summary_large_image",
		title : "TerraFirmaCraft Metal Calculator",
		description : "A simple website to calculate minerals required for metal compositions!",
		images : ["/api/og"]
	}
};

export default function RootLayout(
		{
			children
		} : Readonly<{
			children : React.ReactNode
		}>) {
	return (
			<html lang="en" className="dark">
			<body>
			{children}
			</body>
			</html>
	);
}