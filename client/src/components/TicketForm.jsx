import { useState, useEffect } from "react";

const TicketForm = ({onCreate}) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("MEDIUM");

    const handleSubmit = async (event) => {
        event.preventDefault();

        const ticketData = {
            title,
            description,
            priority,
        };

        const success = await onCreate(ticketData);

        if (success) {
            setTitle("");
            setDescription("");
            setPriority("MEDIUM");
        }
    }

    return (
        <form  onSubmit={handleSubmit}>
            <div>
                <label htmlFor="title">Title</label>
                <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                />
            </div>  
        
            <div>
                <label htmlFor="title">Title</label>
                <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                />
            </div>

            <div>
                <label htmlFor="description">Description</label>
                <textarea
                    id="description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                />
            </div>

            <div>
                <label htmlFor="priority">Priority</label>
                <select
                    id="priority"
                    value={priority}
                    onChange={(event) => setPriority(event.target.value)}
                >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                </select>
            </div>

            <button type="submit">
                Create ticket
            </button>
        </form>
    )
}