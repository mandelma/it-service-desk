import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";

import TicketCard from "./TicketCard.jsx";

afterEach(() => {
    cleanup();
});

test("renders ticket information for user", () => {
    const ticket = {
        id: "ticket-1",
        title: "Printer problem",
        description: "Printer does not work",
        status: "OPEN",
        priority: "HIGH",
        createdBy: {
            id: "user-1",
            name: "Marko",
        },
        assignedTo: null,
    };

    const user = {
        id: "user-1",
        role: "USER",
    };

    render(
        <MemoryRouter>
            <TicketCard
                ticket={ticket}
                user={user}
                users={[]}
                onDelete={vi.fn()}
                onAssignToMe={vi.fn()}
                onUpdate={vi.fn()}
            />
        </MemoryRouter>
    );

    expect(
        screen.getByText("Printer problem")
    ).toBeInTheDocument();

    expect(
        screen.getByText("Printer does not work")
    ).toBeInTheDocument();

    expect(
        screen.queryByText("Assign to me")
    ).not.toBeInTheDocument();

    expect(
        screen.queryByText("Delete")
    ).not.toBeInTheDocument();
});

test("technician can assign unassigned ticket to themselves", async () => {
    const userEventSetup = userEvent.setup();

    const ticket = {
        id: "ticket-1",
        title: "Printer problem",
        description: "Printer does not work",
        status: "OPEN",
        priority: "HIGH",
        createdBy: {
            id: "user-1",
            name: "Marko",
        },
        assignedTo: null,
    };

    const user = {
        id: "tech-1",
        role: "TECHNICIAN",
    };

    const onAssignTicketToMe = vi.fn();

    render(
        <MemoryRouter>
            <TicketCard
                ticket={ticket}
                user={user}
                users={[]}
                onDelete={vi.fn()}
                onAssignTicketToMe={onAssignTicketToMe}
                onUpdate={vi.fn()}
            />
        </MemoryRouter>
    );

    const assignButton = screen.getByRole(
        "button",
        {
            name: "Assign to me",
        }
    );

    expect(assignButton).toBeInTheDocument();

    await userEventSetup.click(assignButton);

    expect(onAssignTicketToMe).toHaveBeenCalledWith(
        "ticket-1"
    );
});

test("does not show assign button when ticket is already assigned", () => {
    const ticket = {
        id: "ticket-1",
        title: "Printer problem",
        description: "Printer does not work",
        status: "IN_PROGRESS",
        priority: "HIGH",
        createdBy: {
            id: "user-1",
            name: "Marko",
        },
        assignedTo: {
            id: "tech-2",
            name: "Other Technician",
        },
    };

    const user = {
        id: "tech-1",
        role: "TECHNICIAN",
    };

    render(
        <MemoryRouter>
            <TicketCard
                ticket={ticket}
                user={user}
                users={[]}
                onDelete={vi.fn()}
                onAssignToMe={vi.fn()}
                onUpdate={vi.fn()}
            />
        </MemoryRouter>
    );

    expect(
        screen.queryByRole("button", {
            name: "Assign to me",
        })
    ).not.toBeInTheDocument();
});

test("technician can update status of ticket assigned to them", async () => {
    const userEventSetup = userEvent.setup();

    const ticket = {
        id: "ticket-1",
        title: "Printer problem",
        description: "Printer does not work",
        status: "IN_PROGRESS",
        priority: "HIGH",
        createdBy: {
            id: "user-1",
            name: "Marko",
        },
        assignedTo: {
            id: "tech-1",
            name: "Technician",
        },
    };

    const user = {
        id: "tech-1",
        role: "TECHNICIAN",
    };

    const onUpdate = vi.fn();

    render(
        <MemoryRouter>
            <TicketCard
                ticket={ticket}
                user={user}
                users={[]}
                onDelete={vi.fn()}
                onAssignToMe={vi.fn()}
                onUpdate={onUpdate}
            />
        </MemoryRouter>
    );

    const statusSelect = screen.getByLabelText("Status");

    expect(statusSelect).toHaveValue("IN_PROGRESS");

    await userEventSetup.selectOptions(
        statusSelect,
        "RESOLVED"
    );

    expect(onUpdate).toHaveBeenCalledWith(
        "ticket-1",
        {
            status: "RESOLVED",
        }
    );
});

test("admin can assign ticket to technician", async () => {
    const userEventSetup = userEvent.setup();

    const ticket = {
        id: "ticket-1",
        title: "Printer problem",
        description: "Printer does not work",
        status: "OPEN",
        priority: "HIGH",
        createdBy: {
            id: "user-1",
            name: "Marko",
        },
        assignedTo: null,
    };

    const user = {
        id: "admin-1",
        role: "ADMIN",
    };

    const users = [
        {
            id: "tech-1",
            name: "Technician One",
            role: "TECHNICIAN",
        },
        {
            id: "user-2",
            name: "Normal User",
            role: "USER",
        },
    ];

    const onUpdate = vi.fn();

    render(
        <MemoryRouter>
            <TicketCard
                ticket={ticket}
                user={user}
                users={users}
                onDelete={vi.fn()}
                onAssignToMe={vi.fn()}
                onUpdate={onUpdate}
            />
        </MemoryRouter>
    );

    const technicianSelect =
        screen.getByLabelText("Assigned to");

    await userEventSetup.selectOptions(
        technicianSelect,
        "tech-1"
    );

    expect(onUpdate).toHaveBeenCalledWith(
        "ticket-1",
        {
            assignedToId: "tech-1",
        }
    );
});

test("admin can delete ticket", async () => {
    const userEventSetup = userEvent.setup();

    const ticket = {
        id: "ticket-1",
        title: "Printer problem",
        description: "Printer does not work",
        status: "OPEN",
        priority: "HIGH",
        createdBy: {
            id: "user-1",
            name: "Marko",
        },
        assignedTo: null,
    };

    const user = {
        id: "admin-1",
        role: "ADMIN",
    };

    const onDelete = vi.fn();

    render(
        <MemoryRouter>
            <TicketCard
                ticket={ticket}
                user={user}
                users={[]}
                onDelete={onDelete}
                onAssignToMe={vi.fn()}
                onUpdate={vi.fn()}
            />
        </MemoryRouter>
    );

    const deleteButton = screen.getByRole(
        "button",
        { name: "Delete" }
    );

    await userEventSetup.click(deleteButton);

    expect(onDelete).toHaveBeenCalledWith(
        "ticket-1"
    );
});

test("normal user cannot change ticket status", () => {
    const ticket = {
        id: "ticket-1",
        title: "Printer problem",
        description: "Printer does not work",
        status: "OPEN",
        priority: "HIGH",
        createdBy: {
            id: "user-1",
            name: "Marko",
        },
        assignedTo: null,
    };

    const user = {
        id: "user-1",
        role: "USER",
    };

    render(
        <MemoryRouter>
            <TicketCard
                ticket={ticket}
                user={user}
                users={[]}
                onDelete={vi.fn()}
                onAssignToMe={vi.fn()}
                onUpdate={vi.fn()}
            />
        </MemoryRouter>
    );

    expect(
        screen.queryByLabelText("Status")
    ).not.toBeInTheDocument();

    expect(
        screen.getByText("Status: OPEN")
    ).toBeInTheDocument();
});