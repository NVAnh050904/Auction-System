import axios from "axios";
const VITE_API = import.meta.env.VITE_API || 'http://localhost:4000';

export const sendMessage = async (formData) => {
    try {
        const res = await axios.post(`${VITE_API}/contact`,
            formData,
        )
        return res.data;
    } catch (error) {
        console.log(error?.response?.data?.error || "Something went wrong");
        throw error;
    }
}