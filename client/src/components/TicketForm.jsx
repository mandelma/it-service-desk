import { useState, useEffect } from "react";

const TicketForm = ({onCreate}) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("MEDIUM");

    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError(null);
        setLoading(true);

        try {
            const ticketData = {
                title,
                description,
                priority,
            };

            const result = await onCreate(ticketData);

            if (result.success) {
                setTitle("");
                setDescription("");
                setPriority("MEDIUM");
            } else {
                setError(result.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form  onSubmit={handleSubmit}>
            {error && <p style={{ color: "red" }}>{error}</p>}

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

            <button type="submit" disabled={loading}>
                {loading ? "Creating ticket..." : "Create ticket"}
            </button>
        </form>
    )
}

export default TicketForm;