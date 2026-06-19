from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

import auth
from routers import admin, agent, controller, passenger

app = FastAPI(title="АИС Аэропорт")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(agent.router)
app.include_router(controller.router)
app.include_router(passenger.router)

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
