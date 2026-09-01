import express from 'express'
import { createServer } from 'node:http'
import { Server, Socket } from 'socket.io'
import dayjs from 'dayjs'

const app = express()
const httpServer = createServer(app)

// Initialize Server
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
})

let connectedUsers = 0

io.on('connection', (socket: Socket) => {
    connectedUsers += 1

    // Assign data to Session storage securely
    socket.data.username =  `User_${socket.id.substring(0, 5)}`

    // BroadCast user count update to all clients
    io.emit('userCountUpdate', connectedUsers)
    console.log(`${socket.data.username} connected`)

    socket.on('sendMessage', (msg) => {
        const payload = {
            user: socket.data.username,
            text: msg,
            time: dayjs().toISOString()
        }
        
        io.emit('message', payload)
    })
    

    // On Editor Change Event
    socket.on('editor-change', (msg: string) => {
        console.log(`Message received from ${socket.data.username}: ${msg}`)

        socket.broadcast.emit('update-editor', msg)
    })

    socket.on('cursor-position', ({cursorPos, row, col}) => {
        console.log(`Position for user ${socket.data.username}, is updated to ${row}, ${col}, ${cursorPos}`)
        const payload = {
            user: socket.data.username,
            cursorPos: cursorPos,
            row: row,
            col: col
        }
        socket.broadcast.emit('update-cursors', payload)
    })

    // // On Undo Event
    // socket.on('undo', () => {
    //     console.log(`Undo event received from ${socket.data.username}`)
    //     socket.broadcast.emit('undo-event')
    // })

    // // On Redo Event
    // socket.on('redo', () => {
    //     console.log(`Redo event received from ${socket.data.username}`)
    //     socket.broadcast.emit('redo-event')
    // })

    // Disconnection Logic
    socket.on('disconnect', () => {
        connectedUsers -= 1
        io.emit('userCountUpdate', connectedUsers)
        console.log(`${socket.data.username} disconnected`)
    })
})

const PORT = process.env.PORT || 4000
httpServer.listen(PORT, ()=>{
    console.log(`Socket running on port ${PORT}`)
})