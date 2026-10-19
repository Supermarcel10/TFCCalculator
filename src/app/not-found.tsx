import Link from "next/link";


export default function NotFound() {
	return (
		<main
			className="container mx-auto px-4 py-8"
			role="main"
			aria-label="Page Not Found"
		>
			<div className="max-w-6xl text-center mx-auto mb-8">
				<h1 className="text-4xl font-bold text-primary mb-8">
					404 - Page Not Found
				</h1>
				<div className="flex justify-center">
					<div className="text-xl max-w-prose">
						<p className="mb-4">
							The page you are looking for does not exist. This can happen when:
						</p>
						<ul className="list-disc text-left pl-8 mb-4">
							<li>The link points to a modpack or version that is no longer supported.</li>
							<li>The address was mistyped or is incomplete.</li>
							<li>The link was shared from an older version of this calculator.</li>
						</ul>
					</div>
				</div>
			</div>

			<div className="max-w-6xl text-center mx-auto mb-8">
				<h3 className="text-3xl font-bold mb-4">Still Stuck?</h3>
				<div className="flex justify-center">
					<p className="text-xl max-w-prose">
						If you can reproduce this, or keep ending up on this page, please{" "}
						<a
							href="https://github.com/Supermarcel10/TFCCalculator/issues/new/choose"
							target="_blank"
							rel="noopener noreferrer"
						>
							open an issue on GitHub
						</a>
						{" "}with the link you followed.
					</p>
				</div>
			</div>

			<div className="flex justify-center">
				<Link
					href="/"
					className="interactive-primary text-white font-bold rounded-lg px-6 py-3"
				>
					Return Home
				</Link>
			</div>
		</main>
	);
}
