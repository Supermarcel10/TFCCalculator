/**
 * @jest-environment jsdom
 */
import {render, screen} from "@testing-library/react";
import "@testing-library/jest-dom";
import NotFound from "@/app/not-found";


describe("NotFound page", () => {
	beforeEach(() => {
		render(<NotFound />);
	});

	it("shows a 404 heading", () => {
		expect(screen.getByRole("heading", {level : 1})).toHaveTextContent(/404/);
	});

	it("explains why the page may not exist", () => {
		expect(screen.getByText(/version that is no longer supported/i)).toBeInTheDocument();
		expect(screen.getByText(/mistyped/i)).toBeInTheDocument();
	});

	it("links to GitHub issues for reporting the problem", () => {
		const link = screen.getByRole("link", {name : /open an issue/i});
		expect(link).toHaveAttribute("href", "https://github.com/Supermarcel10/TFCCalculator/issues/new/choose");
		expect(link).toHaveAttribute("target", "_blank");
		expect(link).toHaveAttribute("rel", "noopener noreferrer");
	});

	it("offers a way back to the home screen", () => {
		expect(screen.getByRole("link", {name : /return home/i})).toHaveAttribute("href", "/");
	});
});
