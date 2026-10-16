import { createApp } from "./app.mjs";
const { app, db, tickAll } = createApp();
const port = Number(process.env.PORT || 3001);
const server = app.listen(port, "0.0.0.0", () =>
  console.log(`Cuidali API iniciada na porta ${port}.`),
);
const timer = setInterval(tickAll, 30000);
timer.unref();
function stop() {
  clearInterval(timer);
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
