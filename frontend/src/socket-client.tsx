import {io, Socket} from 'socket.io-client'

// Initialize the socket instance
// URL must point to your backend port
export const socket: Socket = io("http://localhost:4000", {
    autoConnect: false // Prevent multiple connections during React dev re-renders
})

export interface Message {
    user: string
    text: string
    time: string
}
