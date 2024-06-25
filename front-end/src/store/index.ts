import { combineReducers, configureStore } from "@reduxjs/toolkit";
import userReducer from "./users/user.reducer";
import srSlice from "./sr/sr.reducer";

const rootReducer = combineReducers({
  users: userReducer,
  sr: srSlice,
});

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
