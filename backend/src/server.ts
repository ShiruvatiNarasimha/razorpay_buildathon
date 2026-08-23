import { buildApp } from './app.js';
import { env } from './config/env.js';

async function start() {
  const app = await buildApp();

  try {
    const address = await app.listen({
      port: env.PORT,
      host: env.HOST,
    });

    console.log('\n================================================================');
    console.log(` 🛡️  AgentPay Control Plane API running at: ${address}`);
    console.log(` 🔗  Health check:     ${address}/health`);
    console.log(` 🔗  Readiness probe:  ${address}/ready`);
    console.log(` 🔗  Process Intent:   POST ${address}/api/v1/intents/process`);
    console.log(` 🔗  Adversarial Lab:  POST ${address}/api/v1/attack-lab/run-all`);
    console.log('================================================================\n');

    const handleShutdown = async (signal: string) => {
      console.log(`\nReceived ${signal}. Shutting down AgentPay gracefully...`);
      try {
        await app.close();
        console.log('AgentPay API server closed cleanly.');
        process.exit(0);
      } catch (err) {
        console.error('Error during graceful shutdown:', err);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
