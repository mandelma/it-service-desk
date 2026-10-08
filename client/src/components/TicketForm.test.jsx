import { cleanup,render, screen } from "@testing-library/react";
import { afterEach,expect, test, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

import TicketForm from "./TicketForm.jsx";

afterEach(() => {
    cleanup();
});

test("renders create ticket form", () => {
    render(
        <TicketForm onCreate={() => { }} />
    );

    expect(
        screen.getByText("Create ticket")
    ).toBeInTheDocument();
});

test("submits ticket data", async () => {
    const user = userEvent.setup();

    const onCreate = vi.fn().mockResolvedValue({
        success: true,
    });

    render(
        <TicketForm onCreate={onCreate} />
    );

    await user.type(
        screen.getByLabelText("Title"),
        "Printer problem"
    );

    await user.type(
        screen.getByLabelText("Description"),
        "Printer does not work"
    );

    await user.selectOptions(
        screen.getByLabelText("Priority"),
        "HIGH"
    );

    await user.click(
        screen.getByRole("button", {
            name: "Create ticket",
        })
    );

    expect(onCreate).toHaveBeenCalledWith({
        title: "Printer problem",
        description: "Printer does not work",
        priority: "HIGH",
    });
});

test("shows error message when ticket creation fails", async () => {
    const user = userEvent.setup();

    const onCreate = vi.fn().mockResolvedValue({
        success: false,
        message: "Title must contain at least 3 characters",
    });

    render(
        <TicketForm onCreate={onCreate} />
    );

    await user.type(
        screen.getByLabelText("Title"),
        "ab"
    );

    await user.type(
        screen.getByLabelText("Description"),
        "Printer does not work"
    );

    await user.click(
        screen.getByRole("button", {
            name: "Create ticket",
        })
    );

    expect(
        screen.getByText(
            "Title must contain at least 3 characters"
        )
    ).toBeInTheDocument();
});

test("clears form after successful ticket creation", async () => {
    const user = userEvent.setup();

    const onCreate = vi.fn().mockResolvedValue({
        success: true,
    });

    render(
        <TicketForm onCreate={onCreate} />
    );

    const titleInput = screen.getByLabelText("Title");
    const descriptionInput = screen.getByLabelText("Description");
    const prioritySelect = screen.getByLabelText("Priority");

    await user.type(
        titleInput,
        "Printer problem"
    );

    await user.type(
        descriptionInput,
        "Printer does not work"
    );

    await user.selectOptions(
        prioritySelect,
        "HIGH"
    );

    await user.click(
        screen.getByRole("button", {
            name: "Create ticket",
        })
    );

    expect(titleInput).toHaveValue("");
    expect(descriptionInput).toHaveValue("");
    expect(prioritySelect).toHaveValue("MEDIUM");
});