import { createSlice } from '@reduxjs/toolkit'

const addMessageSlice = createSlice({
  name: 'addMessage',
  initialState: [],
    reducers: {
    addMessage: (state, action) => {
      state.push(action.payload)
    }}})

export const { addMessage } = addMessageSlice.actions

export default addMessageSlice.reducer