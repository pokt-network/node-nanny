import mongoose from 'mongoose'

const connect = async (): Promise<void> => {
    await mongoose.connect(`mongodb+srv://pocket-node-monitor:Je9jmQE2bIUSoCqy@cluster0.vfd7g.mongodb.net/node-monitor?retryWrites=true&w=majority`)
}

const disconnect = async (): Promise<void> => {
    await mongoose.disconnect()
}


export { connect, disconnect }